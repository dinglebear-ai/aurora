//! Component metadata, validation, and deterministic installation planning.
//!
//! The registry intentionally has no runtime or serialization dependencies. A
//! small line-oriented manifest format keeps it suitable for build scripts and
//! installer binaries while the typed API remains the source of truth.

use std::collections::{BTreeMap, BTreeSet};
use std::fmt::{self, Write as _};
use std::fs;
use std::io;
use std::path::{Component as PathComponent, Path};
use std::str::FromStr;

/// Stable high-level grouping used by gallery and installer clients.
#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum Category {
    Foundation,
    Input,
    Collection,
    Overlay,
    Navigation,
    Editor,
    Agent,
    Workspace,
    Devtools,
    Gallery,
}

impl Category {
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Foundation => "foundation",
            Self::Input => "input",
            Self::Collection => "collection",
            Self::Overlay => "overlay",
            Self::Navigation => "navigation",
            Self::Editor => "editor",
            Self::Agent => "agent",
            Self::Workspace => "workspace",
            Self::Devtools => "devtools",
            Self::Gallery => "gallery",
        }
    }
}

impl FromStr for Category {
    type Err = ManifestError;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        match value {
            "foundation" => Ok(Self::Foundation),
            "input" => Ok(Self::Input),
            "collection" => Ok(Self::Collection),
            "overlay" => Ok(Self::Overlay),
            "navigation" => Ok(Self::Navigation),
            "editor" => Ok(Self::Editor),
            "agent" => Ok(Self::Agent),
            "workspace" => Ok(Self::Workspace),
            "devtools" => Ok(Self::Devtools),
            "gallery" => Ok(Self::Gallery),
            _ => Err(ManifestError::UnknownCategory(value.into())),
        }
    }
}

/// A dependency on another registry component.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Dependency {
    pub component: String,
    pub requirement: VersionRequirement,
}

/// Deliberately small compatibility language understood by the installer.
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum VersionRequirement {
    Any,
    Exact(Version),
    AtLeast(Version),
    Compatible(Version),
}

impl VersionRequirement {
    pub fn matches(&self, version: Version) -> bool {
        match self {
            Self::Any => true,
            Self::Exact(required) => version == *required,
            Self::AtLeast(required) => version >= *required,
            Self::Compatible(required) => {
                version >= *required
                    && if required.major > 0 {
                        version.major == required.major
                    } else if required.minor > 0 {
                        version.major == 0 && version.minor == required.minor
                    } else {
                        version == *required
                    }
            }
        }
    }
}

impl fmt::Display for VersionRequirement {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Any => f.write_str("*"),
            Self::Exact(version) => write!(f, "={version}"),
            Self::AtLeast(version) => write!(f, ">={version}"),
            Self::Compatible(version) => write!(f, "^{version}"),
        }
    }
}

impl FromStr for VersionRequirement {
    type Err = ManifestError;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        if value == "*" {
            return Ok(Self::Any);
        }
        let (prefix, raw) = if let Some(raw) = value.strip_prefix(">=") {
            (">=", raw)
        } else if let Some(raw) = value.strip_prefix('^') {
            ("^", raw)
        } else if let Some(raw) = value.strip_prefix('=') {
            ("=", raw)
        } else {
            ("=", value)
        };
        let version = raw.parse()?;
        Ok(match prefix {
            ">=" => Self::AtLeast(version),
            "^" => Self::Compatible(version),
            _ => Self::Exact(version),
        })
    }
}

/// Numeric semantic version used for compatibility checks.
#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct Version {
    pub major: u64,
    pub minor: u64,
    pub patch: u64,
}

impl fmt::Display for Version {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}.{}.{}", self.major, self.minor, self.patch)
    }
}

impl FromStr for Version {
    type Err = ManifestError;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        let parts = value.split('.').collect::<Vec<_>>();
        if parts.len() != 3 {
            return Err(ManifestError::InvalidVersion(value.into()));
        }
        let parse = |part: &str| {
            part.parse()
                .map_err(|_| ManifestError::InvalidVersion(value.into()))
        };
        Ok(Self {
            major: parse(parts[0])?,
            minor: parse(parts[1])?,
            patch: parse(parts[2])?,
        })
    }
}

/// One source file installed by a component.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FileRecord {
    pub source: String,
    pub destination: String,
}

/// Auditable origin for a component implementation.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Provenance {
    pub repository: String,
    pub revision: String,
    pub license: String,
    pub strategy: String,
}

/// Complete installable component record.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Component {
    pub name: String,
    pub description: String,
    pub category: Category,
    pub version: Version,
    pub crate_name: String,
    pub dependencies: Vec<Dependency>,
    pub files: Vec<FileRecord>,
    pub provenance: Option<Provenance>,
}

/// A validated sequence with dependencies preceding their dependants.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct InstallPlan<'a> {
    pub components: Vec<&'a Component>,
    pub files: Vec<&'a FileRecord>,
}

/// A fully resolved copy operation.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MaterializeOperation {
    pub source: std::path::PathBuf,
    pub destination: std::path::PathBuf,
}

#[derive(Clone, Debug, Default)]
pub struct Registry {
    components: BTreeMap<String, Component>,
}

impl Registry {
    /// Iterates over components in stable name order.
    pub fn components(&self) -> impl Iterator<Item = &Component> {
        self.components.values()
    }

    /// Builds and validates a registry.
    ///
    /// # Errors
    ///
    /// Returns a [`RegistryError`] when metadata is inconsistent or unsafe.
    pub fn new(components: impl IntoIterator<Item = Component>) -> Result<Self, RegistryError> {
        let mut registry = Self::default();
        for component in components {
            if registry
                .components
                .insert(component.name.clone(), component)
                .is_some()
            {
                return Err(RegistryError::DuplicateComponent);
            }
        }
        registry.validate()?;
        Ok(registry)
    }

    pub fn get(&self, name: &str) -> Option<&Component> {
        self.components.get(name)
    }

    pub fn iter(&self) -> impl Iterator<Item = &Component> {
        self.components.values()
    }

    /// Validates references, compatibility, paths, file conflicts, and cycles.
    ///
    /// # Errors
    ///
    /// Returns the first deterministic validation failure.
    pub fn validate(&self) -> Result<(), RegistryError> {
        let mut destinations = BTreeMap::<&str, &str>::new();
        for component in self.components.values() {
            validate_identifier(&component.name)?;
            validate_identifier(&component.crate_name)?;
            validate_text(&component.description)?;
            if let Some(provenance) = &component.provenance {
                validate_text(&provenance.repository)?;
                validate_text(&provenance.revision)?;
                validate_text(&provenance.license)?;
                validate_text(&provenance.strategy)?;
            }
            if component.files.is_empty() {
                return Err(RegistryError::MissingFiles(component.name.clone()));
            }
            let mut file_records = BTreeSet::new();
            for file in &component.files {
                validate_relative_path(&file.source)?;
                validate_relative_path(&file.destination)?;
                if !file_records.insert((&file.source, &file.destination)) {
                    return Err(RegistryError::DuplicateFile {
                        component: component.name.clone(),
                        source: file.source.clone(),
                        destination: file.destination.clone(),
                    });
                }
                if let Some(owner) = destinations.insert(&file.destination, &component.name) {
                    return Err(RegistryError::FileConflict {
                        path: file.destination.clone(),
                        first: owner.into(),
                        second: component.name.clone(),
                    });
                }
            }
            let mut dependency_records = BTreeSet::new();
            for dependency in &component.dependencies {
                if !dependency_records.insert(&dependency.component) {
                    return Err(RegistryError::DuplicateDependency {
                        component: component.name.clone(),
                        dependency: dependency.component.clone(),
                    });
                }
                let Some(target) = self.components.get(&dependency.component) else {
                    return Err(RegistryError::UnknownDependency {
                        component: component.name.clone(),
                        dependency: dependency.component.clone(),
                    });
                };
                if !dependency.requirement.matches(target.version) {
                    return Err(RegistryError::IncompatibleDependency {
                        component: component.name.clone(),
                        dependency: dependency.component.clone(),
                        found: target.version,
                        required: dependency.requirement.clone(),
                    });
                }
            }
        }
        for name in self.components.keys() {
            self.visit(
                name,
                &mut BTreeSet::new(),
                &mut BTreeSet::new(),
                &mut Vec::new(),
            )?;
        }
        Ok(())
    }

    /// Resolves requested components and their transitive dependencies.
    ///
    /// # Errors
    ///
    /// Returns an error for an invalid registry or unknown requested component.
    pub fn plan<'a>(&'a self, requested: &[&str]) -> Result<InstallPlan<'a>, RegistryError> {
        self.validate()?;
        let mut resolved = Vec::new();
        let mut complete = BTreeSet::new();
        for name in requested {
            self.visit(name, &mut BTreeSet::new(), &mut complete, &mut resolved)?;
        }
        let files = resolved.iter().flat_map(|item| item.files.iter()).collect();
        Ok(InstallPlan {
            components: resolved,
            files,
        })
    }

    /// Resolves and optionally performs a safe installation.
    ///
    /// Dry runs (`write == false`) never mutate the filesystem. Writes reject
    /// existing destinations and symlinked destination ancestors.
    ///
    /// # Errors
    ///
    /// Returns registry, source containment, destination safety, or I/O errors.
    pub fn materialize(
        &self,
        requested: &[&str],
        source_root: &Path,
        destination_root: &Path,
        write: bool,
    ) -> Result<Vec<MaterializeOperation>, MaterializeError> {
        let plan = self.plan(requested).map_err(MaterializeError::Registry)?;
        let source_root = source_root.canonicalize().map_err(MaterializeError::Io)?;
        if !source_root.is_dir() {
            return Err(MaterializeError::InvalidSourceRoot);
        }
        let destination_root = preflight_destination(&absolute_lexical(destination_root)?)?;
        let mut operations = Vec::with_capacity(plan.files.len());
        for file in plan.files {
            let source = source_root.join(&file.source);
            let source = source.canonicalize().map_err(MaterializeError::Io)?;
            if !source.starts_with(&source_root) || !source.is_file() {
                return Err(MaterializeError::SourceEscape(file.source.clone()));
            }
            let destination = destination_root.join(&file.destination);
            if !destination.starts_with(&destination_root) {
                return Err(MaterializeError::DestinationEscape(
                    file.destination.clone(),
                ));
            }
            operations.push(MaterializeOperation {
                source,
                destination,
            });
        }
        if write {
            publish_atomically(&source_root, &destination_root, &operations)?;
        }
        Ok(operations)
    }

    fn visit<'a>(
        &'a self,
        name: &str,
        active: &mut BTreeSet<String>,
        complete: &mut BTreeSet<String>,
        output: &mut Vec<&'a Component>,
    ) -> Result<(), RegistryError> {
        if complete.contains(name) {
            return Ok(());
        }
        let Some(component) = self.components.get(name) else {
            return Err(RegistryError::UnknownComponent(name.into()));
        };
        if !active.insert(name.into()) {
            return Err(RegistryError::DependencyCycle(name.into()));
        }
        let mut dependencies = component.dependencies.iter().collect::<Vec<_>>();
        dependencies.sort_by(|left, right| left.component.cmp(&right.component));
        for dependency in dependencies {
            self.visit(&dependency.component, active, complete, output)?;
        }
        active.remove(name);
        complete.insert(name.into());
        output.push(component);
        Ok(())
    }

    /// Emits the deterministic `aurora-registry-v1` interchange format.
    pub fn to_manifest(&self) -> String {
        let mut out = String::from("aurora-registry-v1\n");
        for item in self.components.values() {
            writeln!(
                &mut out,
                "component|{}|{}|{}|{}|{}",
                escape(&item.name),
                item.category.as_str(),
                item.version,
                escape(&item.crate_name),
                escape(&item.description)
            )
            .expect("writing to String");
            let mut dependencies = item.dependencies.iter().collect::<Vec<_>>();
            dependencies.sort_by(|left, right| {
                left.component.cmp(&right.component).then_with(|| {
                    left.requirement
                        .to_string()
                        .cmp(&right.requirement.to_string())
                })
            });
            for dep in dependencies {
                writeln!(
                    &mut out,
                    "dependency|{}|{}",
                    escape(&dep.component),
                    dep.requirement
                )
                .expect("writing to String");
            }
            let mut files = item.files.iter().collect::<Vec<_>>();
            files.sort_by(|left, right| {
                left.destination
                    .cmp(&right.destination)
                    .then_with(|| left.source.cmp(&right.source))
            });
            for file in files {
                writeln!(
                    &mut out,
                    "file|{}|{}",
                    escape(&file.source),
                    escape(&file.destination)
                )
                .expect("writing to String");
            }
            if let Some(p) = &item.provenance {
                writeln!(
                    &mut out,
                    "provenance|{}|{}|{}|{}",
                    escape(&p.repository),
                    escape(&p.revision),
                    escape(&p.license),
                    escape(&p.strategy)
                )
                .expect("writing to String");
            }
            out.push_str("end\n");
        }
        out
    }

    /// Loads and validates a registry from the v1 interchange format.
    ///
    /// # Errors
    ///
    /// Returns a syntax, version, category, or registry validation error.
    pub fn from_manifest(input: &str) -> Result<Self, ManifestError> {
        parse_manifest(input).and_then(|items| Self::new(items).map_err(ManifestError::Registry))
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RegistryError {
    DuplicateComponent,
    UnknownComponent(String),
    UnknownDependency {
        component: String,
        dependency: String,
    },
    IncompatibleDependency {
        component: String,
        dependency: String,
        found: Version,
        required: VersionRequirement,
    },
    DependencyCycle(String),
    DuplicateDependency {
        component: String,
        dependency: String,
    },
    DuplicateFile {
        component: String,
        source: String,
        destination: String,
    },
    InvalidIdentifier(String),
    InvalidText,
    UnsafePath(String),
    MissingFiles(String),
    FileConflict {
        path: String,
        first: String,
        second: String,
    },
}

impl fmt::Display for RegistryError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{self:?}")
    }
}

impl std::error::Error for RegistryError {}

#[derive(Debug)]
pub enum MaterializeError {
    Registry(RegistryError),
    Io(io::Error),
    InvalidSourceRoot,
    InvalidDestinationRoot,
    SourceEscape(String),
    DestinationEscape(String),
    DestinationExists(std::path::PathBuf),
    Symlink(std::path::PathBuf),
}

impl fmt::Display for MaterializeError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{self:?}")
    }
}

impl std::error::Error for MaterializeError {}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ManifestError {
    InvalidHeader,
    InvalidLine { line: usize, message: String },
    InvalidVersion(String),
    UnknownCategory(String),
    Registry(RegistryError),
}

impl fmt::Display for ManifestError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{self:?}")
    }
}

impl std::error::Error for ManifestError {}

fn validate_identifier(value: &str) -> Result<(), RegistryError> {
    if value.is_empty()
        || !value
            .bytes()
            .all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'-')
    {
        return Err(RegistryError::InvalidIdentifier(value.into()));
    }
    Ok(())
}

fn validate_relative_path(value: &str) -> Result<(), RegistryError> {
    validate_text(value)?;
    let path = Path::new(value);
    if value.is_empty()
        || value.contains('\\')
        || value.contains(':')
        || path.is_absolute()
        || path
            .components()
            .any(|part| !matches!(part, PathComponent::Normal(_)))
    {
        return Err(RegistryError::UnsafePath(value.into()));
    }
    Ok(())
}

fn validate_text(value: &str) -> Result<(), RegistryError> {
    if value.chars().any(char::is_control) {
        return Err(RegistryError::InvalidText);
    }
    Ok(())
}

fn absolute_lexical(path: &Path) -> Result<std::path::PathBuf, MaterializeError> {
    let absolute = if path.is_absolute() {
        path.to_path_buf()
    } else {
        std::env::current_dir()
            .map_err(MaterializeError::Io)?
            .join(path)
    };
    Ok(absolute)
}

fn preflight_destination(path: &Path) -> Result<std::path::PathBuf, MaterializeError> {
    let name = path
        .file_name()
        .ok_or(MaterializeError::InvalidDestinationRoot)?;
    let parent = path
        .parent()
        .ok_or(MaterializeError::InvalidDestinationRoot)?;
    reject_symlink_ancestors(parent)?;
    let metadata = fs::symlink_metadata(parent).map_err(MaterializeError::Io)?;
    if metadata.file_type().is_symlink() {
        return Err(MaterializeError::Symlink(parent.to_path_buf()));
    }
    if !metadata.is_dir() {
        return Err(MaterializeError::InvalidDestinationRoot);
    }
    let destination = parent
        .canonicalize()
        .map_err(MaterializeError::Io)?
        .join(name);
    match fs::symlink_metadata(&destination) {
        Ok(metadata) if metadata.file_type().is_symlink() => {
            Err(MaterializeError::Symlink(destination))
        }
        Ok(_) => Err(MaterializeError::DestinationExists(destination)),
        Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(destination),
        Err(error) => Err(MaterializeError::Io(error)),
    }
}

fn reject_symlink_ancestors(path: &Path) -> Result<(), MaterializeError> {
    let absolute = absolute_lexical(path)?;
    let mut current = std::path::PathBuf::new();
    for component in absolute.components() {
        current.push(component.as_os_str());
        let metadata = fs::symlink_metadata(&current).map_err(MaterializeError::Io)?;
        if metadata.file_type().is_symlink() {
            return Err(MaterializeError::Symlink(current));
        }
    }
    Ok(())
}

fn publish_atomically(
    source_root: &Path,
    destination: &Path,
    operations: &[MaterializeOperation],
) -> Result<(), MaterializeError> {
    let parent = destination
        .parent()
        .ok_or(MaterializeError::InvalidDestinationRoot)?;
    let stage = create_private_stage(parent)?;
    let result = (|| {
        for operation in operations {
            let source = operation
                .source
                .canonicalize()
                .map_err(MaterializeError::Io)?;
            if source != operation.source || !source.starts_with(source_root) || !source.is_file() {
                return Err(MaterializeError::SourceEscape(source.display().to_string()));
            }
            let relative = operation
                .destination
                .strip_prefix(destination)
                .map_err(|_| MaterializeError::InvalidDestinationRoot)?;
            let staged = stage.join(relative);
            let staged_parent = staged
                .parent()
                .ok_or(MaterializeError::InvalidDestinationRoot)?;
            fs::create_dir_all(staged_parent).map_err(MaterializeError::Io)?;
            fs::copy(&source, &staged).map_err(MaterializeError::Io)?;
        }
        rename_noreplace(&stage, destination)
    })();
    if result.is_err() {
        let _ = fs::remove_dir_all(&stage);
    }
    result
}

fn rename_noreplace(stage: &Path, destination: &Path) -> Result<(), MaterializeError> {
    rustix::fs::renameat_with(
        rustix::fs::CWD,
        stage,
        rustix::fs::CWD,
        destination,
        rustix::fs::RenameFlags::NOREPLACE,
    )
    .map_err(|error| {
        let io_error: io::Error = error.into();
        if io_error.kind() == io::ErrorKind::AlreadyExists {
            MaterializeError::DestinationExists(destination.to_path_buf())
        } else {
            MaterializeError::Io(io_error)
        }
    })
}

fn create_private_stage(parent: &Path) -> Result<std::path::PathBuf, MaterializeError> {
    for nonce in 0..100_u32 {
        let stage = parent.join(format!(".aurora-stage-{}-{nonce}", std::process::id()));
        match fs::create_dir(&stage) {
            Ok(()) => {
                #[cfg(unix)]
                {
                    use std::os::unix::fs::PermissionsExt as _;
                    if let Err(error) =
                        fs::set_permissions(&stage, fs::Permissions::from_mode(0o700))
                    {
                        let _ = fs::remove_dir(&stage);
                        return Err(MaterializeError::Io(error));
                    }
                }
                return Ok(stage);
            }
            Err(error) if error.kind() == io::ErrorKind::AlreadyExists => {}
            Err(error) => return Err(MaterializeError::Io(error)),
        }
    }
    Err(MaterializeError::Io(io::Error::new(
        io::ErrorKind::AlreadyExists,
        "no private staging name available",
    )))
}

fn escape(value: &str) -> String {
    value
        .replace('%', "%25")
        .replace('|', "%7C")
        .replace('\n', "%0A")
}
fn unescape(value: &str) -> String {
    value
        .replace("%0A", "\n")
        .replace("%7C", "|")
        .replace("%25", "%")
}

fn parse_manifest(input: &str) -> Result<Vec<Component>, ManifestError> {
    let mut lines = input.lines().enumerate();
    if lines.next().map(|(_, line)| line) != Some("aurora-registry-v1") {
        return Err(ManifestError::InvalidHeader);
    }
    let mut output = Vec::new();
    let mut current: Option<Component> = None;
    for (index, line) in lines {
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let fields = line.split('|').collect::<Vec<_>>();
        match fields.as_slice() {
            [
                "component",
                name,
                category,
                version,
                crate_name,
                description,
            ] if current.is_none() => {
                current = Some(Component {
                    name: unescape(name),
                    description: unescape(description),
                    category: category.parse()?,
                    version: version.parse()?,
                    crate_name: unescape(crate_name),
                    dependencies: Vec::new(),
                    files: Vec::new(),
                    provenance: None,
                });
            }
            ["dependency", name, requirement] => current
                .as_mut()
                .ok_or_else(|| line_error(index, "dependency outside component"))?
                .dependencies
                .push(Dependency {
                    component: unescape(name),
                    requirement: requirement.parse()?,
                }),
            ["file", source, destination] => current
                .as_mut()
                .ok_or_else(|| line_error(index, "file outside component"))?
                .files
                .push(FileRecord {
                    source: unescape(source),
                    destination: unescape(destination),
                }),
            ["provenance", repository, revision, license, strategy] => {
                let item = current
                    .as_mut()
                    .ok_or_else(|| line_error(index, "provenance outside component"))?;
                if item.provenance.is_some() {
                    return Err(line_error(index, "duplicate provenance"));
                }
                item.provenance = Some(Provenance {
                    repository: unescape(repository),
                    revision: unescape(revision),
                    license: unescape(license),
                    strategy: unescape(strategy),
                });
            }
            ["end"] => output.push(
                current
                    .take()
                    .ok_or_else(|| line_error(index, "end outside component"))?,
            ),
            _ => return Err(line_error(index, "unrecognized or misplaced record")),
        }
    }
    if current.is_some() {
        return Err(ManifestError::InvalidLine {
            line: input.lines().count(),
            message: "unterminated component".into(),
        });
    }
    Ok(output)
}

fn line_error(index: usize, message: &str) -> ManifestError {
    ManifestError::InvalidLine {
        line: index + 1,
        message: message.into(),
    }
}

/// Built-in catalog covering the current crate-level product families.
///
/// # Panics
///
/// Panics only if this compile-time catalog violates its own schema, which is
/// also covered by the registry test suite.
#[allow(clippy::too_many_lines)]
pub fn builtin_registry() -> Registry {
    let mut components = [
        seed(
            "core",
            Category::Foundation,
            "aurora-gpui-core",
            &[],
            &["Cargo.toml", "src/color.rs", "src/lib.rs", "src/theme.rs"],
        ),
        seed(
            "ui",
            Category::Input,
            "aurora-gpui-ui",
            &[("core", "^0.1.0")],
            &[
                "Cargo.toml",
                "examples/primitives.rs",
                "src/badge.rs",
                "src/button.rs",
                "src/input.rs",
                "src/label.rs",
                "src/lib.rs",
                "src/list.rs",
                "src/menu.rs",
                "src/overlay.rs",
                "src/scrollbar.rs",
                "src/table.rs",
                "src/tabs.rs",
                "src/toggle.rs",
            ],
        ),
        seed(
            "editor",
            Category::Editor,
            "aurora-gpui-editor",
            &[("core", "^0.1.0"), ("ui", "^0.1.0")],
            &["Cargo.toml", "examples/provider_editor.rs", "src/lib.rs"],
        ),
        seed(
            "agent",
            Category::Agent,
            "aurora-gpui-agent",
            &[("core", "^0.1.0")],
            &[
                "Cargo.toml",
                "examples/provider_driven.rs",
                "src/composer.rs",
                "src/conversation.rs",
                "src/lib.rs",
                "src/provider.rs",
                "src/render.rs",
                "src/view.rs",
            ],
        ),
        seed(
            "workspace",
            Category::Workspace,
            "aurora-gpui-workspace",
            &[("core", "^0.1.0")],
            &["Cargo.toml", "examples/workspace_shell.rs", "src/lib.rs"],
        ),
        seed(
            "devtools",
            Category::Devtools,
            "aurora-gpui-devtools",
            &[
                ("core", "^0.1.0"),
                ("editor", "^0.1.0"),
                ("ui", "^0.1.0"),
                ("workspace", "^0.1.0"),
            ],
            &["Cargo.toml", "examples/devtools_gallery.rs", "src/lib.rs"],
        ),
        seed(
            "registry",
            Category::Foundation,
            "aurora-gpui-registry",
            &[],
            &["Cargo.toml", "README.md", "src/lib.rs", "src/main.rs"],
        ),
        seed(
            "gallery",
            Category::Gallery,
            "aurora-gpui-gallery",
            &[
                ("agent", "^0.1.0"),
                ("core", "^0.1.0"),
                ("devtools", "^0.1.0"),
                ("editor", "^0.1.0"),
                ("registry", "^0.1.0"),
                ("ui", "^0.1.0"),
                ("workspace", "^0.1.0"),
            ],
            &[
                "Cargo.toml",
                "README.md",
                "examples/native_gallery.rs",
                "src/lib.rs",
            ],
        ),
    ];
    for component in &mut components {
        let provenance = match component.name.as_str() {
            "core" => "provenance/gpui.toml",
            "ui" => "provenance/ui-primitives.toml",
            "editor" => "provenance/editor-platform.toml",
            "agent" => "provenance/agent-chat.toml",
            "workspace" => "provenance/workspace-shell.toml",
            "devtools" => "provenance/devtools-platform.toml",
            "registry" => "provenance/registry-platform.toml",
            "gallery" => "provenance/gallery-platform.toml",
            _ => unreachable!("compile-time component catalog"),
        };
        component.files.extend([
            FileRecord {
                source: "LICENSE".into(),
                destination: format!("vendor/{}/LICENSE", component.crate_name),
            },
            FileRecord {
                source: provenance.into(),
                destination: format!("vendor/{}/PROVENANCE.toml", component.crate_name),
            },
        ]);
    }
    Registry::new(components).expect("built-in catalog is valid")
}

fn seed(
    name: &str,
    category: Category,
    crate_name: &str,
    dependencies: &[(&str, &str)],
    files: &[&str],
) -> Component {
    Component {
        name: name.into(),
        description: format!("Aurora GPUI {name} components"),
        category,
        version: Version {
            major: 0,
            minor: 1,
            patch: 0,
        },
        crate_name: crate_name.into(),
        dependencies: dependencies
            .iter()
            .map(|(component, version)| Dependency {
                component: (*component).into(),
                requirement: version.parse().expect("seed version"),
            })
            .collect(),
        files: files
            .iter()
            .map(|file| FileRecord {
                source: format!("crates/{crate_name}/{file}"),
                destination: format!("vendor/{crate_name}/{file}"),
            })
            .collect(),
        provenance: Some(Provenance {
            repository: "https://github.com/dinglebear-ai/aurora".into(),
            revision: "workspace".into(),
            license: "AGPL-3.0-only".into(),
            strategy: "native".into(),
        }),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temporary_directory(label: &str) -> std::path::PathBuf {
        let unique = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let path = std::env::temp_dir().canonicalize().unwrap().join(format!(
            "aurora-registry-{label}-{}-{unique}",
            std::process::id()
        ));
        fs::create_dir_all(&path).unwrap();
        path
    }

    #[test]
    fn resolves_transitive_dependencies_before_requested_component() {
        let registry = builtin_registry();
        let plan = registry.plan(&["devtools"]).unwrap();
        assert_eq!(
            plan.components
                .iter()
                .map(|item| item.name.as_str())
                .collect::<Vec<_>>(),
            ["core", "ui", "editor", "workspace", "devtools"]
        );
    }

    #[test]
    fn manifest_round_trip_is_deterministic() {
        let text = builtin_registry().to_manifest();
        let restored = Registry::from_manifest(&text).unwrap();
        assert_eq!(restored.to_manifest(), text);
    }

    #[test]
    fn emission_canonicalizes_record_order() {
        let mut first = seed(
            "item",
            Category::Input,
            "item",
            &[("b", "*"), ("a", "*")],
            &["z.rs", "a.rs"],
        );
        let a = seed("a", Category::Foundation, "a", &[], &["lib.rs"]);
        let b = seed("b", Category::Foundation, "b", &[], &["lib.rs"]);
        let registry = Registry::new([first.clone(), a.clone(), b.clone()]).unwrap();
        first.dependencies.reverse();
        first.files.reverse();
        let reordered = Registry::new([b, first, a]).unwrap();
        assert_eq!(registry.to_manifest(), reordered.to_manifest());
    }

    #[test]
    fn built_in_catalog_references_every_existing_package_file() {
        let registry = builtin_registry();
        for item in registry.iter() {
            let workspace = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
            let package = workspace.join("crates").join(&item.crate_name);
            let expected = fs::read_dir(&package)
                .unwrap()
                .flat_map(|entry| {
                    let path = entry.unwrap().path();
                    if path.is_dir() {
                        fs::read_dir(path)
                            .unwrap()
                            .map(|nested| nested.unwrap().path())
                            .collect::<Vec<_>>()
                    } else {
                        vec![path]
                    }
                })
                .filter(|path| path.is_file())
                .map(|path| {
                    path.strip_prefix(&workspace)
                        .unwrap()
                        .to_string_lossy()
                        .replace('\\', "/")
                })
                .collect::<BTreeSet<_>>();
            let actual = item
                .files
                .iter()
                .filter(|file| {
                    file.source
                        .starts_with(&format!("crates/{}/", item.crate_name))
                })
                .map(|file| file.source.clone())
                .collect::<BTreeSet<_>>();
            assert_eq!(
                actual, expected,
                "incomplete built-in inventory for {}",
                item.name
            );
        }
    }

    #[test]
    fn rejects_path_traversal() {
        let mut item = seed("bad", Category::Foundation, "bad", &[], &["src/lib.rs"]);
        item.files[0].destination = "../secrets".into();
        assert!(matches!(
            Registry::new([item]),
            Err(RegistryError::UnsafePath(_))
        ));
    }

    #[test]
    fn rejects_portable_windows_path_traversal() {
        let mut item = seed("bad", Category::Foundation, "bad", &[], &["src/lib.rs"]);
        item.files[0].destination = r"..\secrets".into();
        assert!(matches!(
            Registry::new([item]),
            Err(RegistryError::UnsafePath(_))
        ));
    }

    #[test]
    fn rejects_duplicate_components() {
        let item = seed("same", Category::Foundation, "same", &[], &["lib.rs"]);
        assert_eq!(
            Registry::new([item.clone(), item]).unwrap_err(),
            RegistryError::DuplicateComponent
        );
    }

    #[test]
    fn rejects_duplicate_dependency_and_file_records() {
        let core = seed("core", Category::Foundation, "core", &[], &["lib.rs"]);
        let mut item = seed("item", Category::Input, "item", &[("core", "*")], &["a.rs"]);
        item.dependencies.push(item.dependencies[0].clone());
        assert!(matches!(
            Registry::new([core.clone(), item]),
            Err(RegistryError::DuplicateDependency { .. })
        ));
        let mut item = seed("item", Category::Input, "item", &[("core", "*")], &["a.rs"]);
        item.files.push(item.files[0].clone());
        assert!(matches!(
            Registry::new([core, item]),
            Err(RegistryError::DuplicateFile { .. })
        ));
    }

    #[test]
    fn rejects_duplicate_provenance_and_decoded_controls() {
        let manifest = builtin_registry().to_manifest();
        let provenance = manifest
            .lines()
            .find(|line| line.starts_with("provenance|"))
            .unwrap();
        let duplicated = manifest.replacen("end\n", &format!("{provenance}\nend\n"), 1);
        assert!(matches!(
            Registry::from_manifest(&duplicated),
            Err(ManifestError::InvalidLine { .. })
        ));
        let controls = manifest.replacen("Aurora GPUI agent components", "bad%0Atext", 1);
        assert!(matches!(
            Registry::from_manifest(&controls),
            Err(ManifestError::Registry(RegistryError::InvalidText))
        ));
    }

    #[test]
    fn rejects_cycles() {
        let a = seed("a", Category::Foundation, "a", &[("b", "*")], &["a.rs"]);
        let b = seed("b", Category::Foundation, "b", &[("a", "*")], &["b.rs"]);
        assert!(matches!(
            Registry::new([a, b]),
            Err(RegistryError::DependencyCycle(_))
        ));
    }

    #[test]
    fn rejects_destination_conflicts() {
        let a = seed("a", Category::Foundation, "a", &[], &["lib.rs"]);
        let mut b = seed("b", Category::Foundation, "b", &[], &["lib.rs"]);
        b.files[0].destination = a.files[0].destination.clone();
        assert!(matches!(
            Registry::new([a, b]),
            Err(RegistryError::FileConflict { .. })
        ));
    }

    #[test]
    fn rejects_incompatible_versions() {
        let core = seed("core", Category::Foundation, "core", &[], &["lib.rs"]);
        let ui = seed(
            "ui",
            Category::Input,
            "ui",
            &[("core", ">=2.0.0")],
            &["lib.rs"],
        );
        assert!(matches!(
            Registry::new([core, ui]),
            Err(RegistryError::IncompatibleDependency { .. })
        ));
    }

    #[test]
    fn caret_requirements_follow_pre_one_semver_rules() {
        let requirement: VersionRequirement = "^0.1.0".parse().unwrap();
        assert!(requirement.matches("0.1.9".parse().unwrap()));
        assert!(!requirement.matches("0.2.0".parse().unwrap()));
    }

    #[test]
    fn malformed_manifest_has_a_line_number() {
        let error = Registry::from_manifest("aurora-registry-v1\nfile|a|b\n").unwrap_err();
        assert!(matches!(error, ManifestError::InvalidLine { line: 2, .. }));
    }

    #[test]
    fn materialization_is_dry_run_first_and_refuses_overwrite() {
        let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
        let temp = temporary_directory("install");
        let destination = temp.join("output");
        let registry = builtin_registry();
        let dry_run = registry
            .materialize(&["core"], &root, &destination, false)
            .unwrap();
        assert!(!destination.exists());
        assert_eq!(dry_run.len(), registry.get("core").unwrap().files.len());
        registry
            .materialize(&["core"], &root, &destination, true)
            .unwrap();
        assert!(
            destination
                .join("vendor/aurora-gpui-core/Cargo.toml")
                .is_file()
        );
        assert_eq!(
            fs::read_dir(&temp)
                .unwrap()
                .filter_map(Result::ok)
                .filter(|entry| entry
                    .file_name()
                    .to_string_lossy()
                    .starts_with(".aurora-stage-"))
                .count(),
            0
        );
        assert!(matches!(
            registry.materialize(&["core"], &root, &destination, true),
            Err(MaterializeError::DestinationExists(_))
        ));
        fs::remove_dir_all(temp).unwrap();
    }

    #[test]
    fn failed_preflight_leaves_no_destination_or_stage() {
        let root = temporary_directory("bad-source");
        fs::write(root.join("present.rs"), "present").unwrap();
        let temp = temporary_directory("failed-install");
        let destination = temp.join("output");
        let mut item = seed(
            "item",
            Category::Foundation,
            "item",
            &[],
            &["present.rs", "missing.rs"],
        );
        for file in &mut item.files {
            file.source = file.source.rsplit('/').next().unwrap().into();
        }
        let registry = Registry::new([item]).unwrap();
        assert!(
            registry
                .materialize(&["item"], &root, &destination, true)
                .is_err()
        );
        assert!(!destination.exists());
        assert_eq!(fs::read_dir(&temp).unwrap().count(), 0);
        fs::remove_dir_all(root).unwrap();
        fs::remove_dir_all(temp).unwrap();
    }

    #[test]
    fn materialization_refuses_an_existing_empty_destination() {
        let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
        let temp = temporary_directory("existing-empty");
        let destination = temp.join("output");
        fs::create_dir(&destination).unwrap();
        assert!(matches!(
            builtin_registry().materialize(&["core"], &root, &destination, true),
            Err(MaterializeError::DestinationExists(_))
        ));
        assert_eq!(fs::read_dir(&destination).unwrap().count(), 0);
        fs::remove_dir_all(temp).unwrap();
    }

    #[test]
    fn atomic_publish_never_replaces_a_concurrently_created_destination() {
        let temp = temporary_directory("atomic-no-replace");
        let stage = temp.join("stage");
        let destination = temp.join("output");
        fs::create_dir(&stage).unwrap();
        fs::write(stage.join("payload"), "staged").unwrap();
        fs::create_dir(&destination).unwrap();
        fs::write(destination.join("winner"), "concurrent").unwrap();

        assert!(matches!(
            rename_noreplace(&stage, &destination),
            Err(MaterializeError::DestinationExists(_))
        ));
        assert_eq!(
            fs::read_to_string(destination.join("winner")).unwrap(),
            "concurrent"
        );
        assert!(stage.join("payload").is_file());
        fs::remove_dir_all(temp).unwrap();
    }

    #[test]
    fn invalid_registry_validation_is_non_mutating() {
        let temp = temporary_directory("invalid-destination");
        let destination = temp.join("output");
        let mut item = seed("bad", Category::Foundation, "bad", &[], &["missing.rs"]);
        item.files[0].destination = "../escape".into();
        assert!(matches!(
            Registry::new([item]),
            Err(RegistryError::UnsafePath(_))
        ));
        assert!(!destination.exists());
        assert_eq!(fs::read_dir(&temp).unwrap().count(), 0);
        fs::remove_dir_all(temp).unwrap();
    }

    #[cfg(unix)]
    #[test]
    fn materialization_rejects_destination_symlink_escape() {
        use std::os::unix::fs::symlink;
        let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
        let temp = temporary_directory("symlink");
        let outside = temp.join("outside");
        fs::create_dir(&outside).unwrap();
        let link = temp.join("link");
        symlink(&outside, &link).unwrap();
        let error = builtin_registry()
            .materialize(&["core"], &root, &link.join("output"), true)
            .unwrap_err();
        assert!(matches!(error, MaterializeError::Symlink(_)));
        fs::remove_dir_all(temp).unwrap();
    }

    #[cfg(unix)]
    #[test]
    fn materialization_rejects_a_nested_symlink_ancestor() {
        use std::os::unix::fs::symlink;
        let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
        let temp = temporary_directory("nested-symlink");
        let outside = temp.join("outside");
        fs::create_dir_all(outside.join("real-parent")).unwrap();
        let link = temp.join("link");
        symlink(&outside, &link).unwrap();
        let destination = link.join("real-parent/output");
        let error = builtin_registry()
            .materialize(&["core"], &root, &destination, true)
            .unwrap_err();
        assert!(matches!(error, MaterializeError::Symlink(_)));
        assert!(!outside.join("real-parent/output").exists());
        fs::remove_dir_all(temp).unwrap();
    }

    #[cfg(unix)]
    #[test]
    fn materialization_refuses_a_direct_destination_symlink() {
        use std::os::unix::fs::symlink;
        let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
        let temp = temporary_directory("direct-symlink");
        let outside = temp.join("outside");
        fs::create_dir(&outside).unwrap();
        let destination = temp.join("output");
        symlink(&outside, &destination).unwrap();
        assert!(matches!(
            builtin_registry().materialize(&["core"], &root, &destination, true),
            Err(MaterializeError::Symlink(_))
        ));
        assert_eq!(fs::read_dir(&outside).unwrap().count(), 0);
        fs::remove_dir_all(temp).unwrap();
    }
}
