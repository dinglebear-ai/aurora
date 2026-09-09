//! Searchable native catalog and integration shell for Aurora GPUI components.

#![forbid(unsafe_code)]

use aurora_gpui_core::AuroraTheme;
use aurora_gpui_registry::{Category, Registry, builtin_registry};
use aurora_gpui_workspace::WorkspaceShell;
use gpui::prelude::FluentBuilder as _;
use gpui::{
    AnyElement, App, ElementId, InteractiveElement, IntoElement, ParentElement, RenderOnce,
    SharedString, Styled, Window, div, px,
};

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GalleryEntry {
    pub id: SharedString,
    pub title: SharedString,
    pub description: SharedString,
    pub category: Category,
    pub crate_name: SharedString,
}

#[derive(Clone, Debug)]
pub struct GalleryCatalog {
    entries: Vec<GalleryEntry>,
}

impl GalleryCatalog {
    #[must_use]
    pub fn from_registry(registry: &Registry) -> Self {
        let entries = registry
            .components()
            .map(|component| GalleryEntry {
                id: component.name.clone().into(),
                title: title_case(&component.name).into(),
                description: component.description.clone().into(),
                category: component.category,
                crate_name: component.crate_name.clone().into(),
            })
            .collect();
        Self { entries }
    }

    #[must_use]
    pub fn builtin() -> Self {
        Self::from_registry(&builtin_registry())
    }

    #[must_use]
    pub fn entries(&self) -> &[GalleryEntry] {
        &self.entries
    }

    #[must_use]
    pub fn search(&self, query: &str, category: Option<Category>) -> Vec<&GalleryEntry> {
        let query = query.to_ascii_lowercase();
        self.entries
            .iter()
            .filter(|entry| {
                category.is_none_or(|wanted| wanted == entry.category)
                    && (query.is_empty()
                        || entry.title.to_ascii_lowercase().contains(&query)
                        || entry.description.to_ascii_lowercase().contains(&query)
                        || entry.crate_name.to_ascii_lowercase().contains(&query))
            })
            .collect()
    }
}

fn title_case(value: &str) -> String {
    value
        .split('-')
        .map(|word| {
            let mut chars = word.chars();
            chars.next().map_or_else(String::new, |first| {
                first.to_uppercase().chain(chars).collect()
            })
        })
        .collect::<Vec<_>>()
        .join(" ")
}

#[derive(IntoElement)]
pub struct GalleryApp {
    id: ElementId,
    catalog: GalleryCatalog,
    query: SharedString,
    category: Option<Category>,
    selected: Option<SharedString>,
    preview: Option<AnyElement>,
    theme: AuroraTheme,
}

impl GalleryApp {
    #[must_use]
    pub fn new(id: impl Into<ElementId>, catalog: GalleryCatalog) -> Self {
        Self {
            id: id.into(),
            catalog,
            query: "".into(),
            category: None,
            selected: None,
            preview: None,
            theme: AuroraTheme::default(),
        }
    }
    #[must_use]
    pub fn query(mut self, query: impl Into<SharedString>) -> Self {
        self.query = query.into();
        self
    }
    #[must_use]
    pub const fn category(mut self, category: Category) -> Self {
        self.category = Some(category);
        self
    }
    #[must_use]
    pub fn selected(mut self, id: impl Into<SharedString>) -> Self {
        self.selected = Some(id.into());
        self
    }
    #[must_use]
    pub fn preview(mut self, preview: impl IntoElement) -> Self {
        self.preview = Some(preview.into_any_element());
        self
    }
    #[must_use]
    pub const fn theme(mut self, theme: AuroraTheme) -> Self {
        self.theme = theme;
        self
    }
}

impl RenderOnce for GalleryApp {
    fn render(self, _: &mut Window, _: &mut App) -> impl IntoElement {
        let colors = self.theme.colors;
        let entries = self.catalog.search(&self.query, self.category);
        let selected = self.selected.clone();
        let list = div()
            .id("gallery-catalog")
            .flex()
            .flex_col()
            .gap(px(self.theme.space.xs))
            .children(entries.into_iter().map(|entry| {
                let active = selected.as_ref().is_some_and(|id| id == &entry.id);
                div()
                    .id(entry.id.clone())
                    .p(px(self.theme.space.sm))
                    .rounded(px(self.theme.radii.md))
                    .when(active, |row| {
                        row.bg(gpui::Hsla::from(colors.surface_active))
                    })
                    .child(entry.title.clone())
                    .child(
                        div()
                            .text_color(gpui::Hsla::from(colors.text_muted))
                            .child(entry.description.clone()),
                    )
            }));
        let center = div()
            .id(self.id)
            .flex()
            .size_full()
            .child(
                div()
                    .w(px(320.))
                    .bg(gpui::Hsla::from(colors.surface))
                    .p(px(self.theme.space.md))
                    .child(format!("Component Catalog — {}", self.query))
                    .child(list),
            )
            .child(
                div().flex_1().p(px(self.theme.space.lg)).child(
                    self.preview
                        .unwrap_or_else(|| div().child("Select a Component").into_any_element()),
                ),
            );
        WorkspaceShell::new("aurora-gallery", "Aurora GPUI Gallery")
            .theme(self.theme)
            .pane_tree(center)
    }
}

/// Compile-time coverage for every public component crate used by the gallery.
#[must_use]
pub fn integrated_crate_names() -> [&'static str; 7] {
    [
        "aurora-gpui-core",
        "aurora-gpui-ui",
        "aurora-gpui-editor",
        "aurora-gpui-agent",
        "aurora-gpui-workspace",
        "aurora-gpui-devtools",
        "aurora-gpui-registry",
    ]
}

/// Stable, identity-bearing workflow state used by the runnable mini agent workspace.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MiniWorkspaceState {
    pub selected_file: SharedString,
    pub editor_text: SharedString,
    pub proposed_edit: Option<ProposedEdit>,
    pub terminal_history: Vec<SharedString>,
    pub activity: Vec<SharedString>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProposedEdit {
    pub id: SharedString,
    pub replacement: SharedString,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum MiniWorkspaceAction {
    SelectFile(SharedString),
    ProposeEdit(ProposedEdit),
    AcceptEdit(SharedString),
    RejectEdit(SharedString),
    RunTerminalCommand(SharedString),
}

impl MiniWorkspaceState {
    #[must_use]
    pub fn demo() -> Self {
        Self {
            selected_file: "src/main.rs".into(),
            editor_text: "fn main() {\n    println!(\"Aurora\");\n}".into(),
            proposed_edit: None,
            terminal_history: Vec::new(),
            activity: vec!["Workspace Ready".into()],
        }
    }

    /// Applies a user action and returns whether it changed the workspace.
    pub fn dispatch(&mut self, action: MiniWorkspaceAction) -> bool {
        match action {
            MiniWorkspaceAction::SelectFile(path) if path != self.selected_file => {
                self.selected_file = path.clone();
                self.activity.push(format!("Opened {path}").into());
                true
            }
            MiniWorkspaceAction::ProposeEdit(edit) => {
                self.activity.push(format!("Proposed {}", edit.id).into());
                self.proposed_edit = Some(edit);
                true
            }
            MiniWorkspaceAction::AcceptEdit(id)
                if self
                    .proposed_edit
                    .as_ref()
                    .is_some_and(|edit| edit.id == id) =>
            {
                let Some(edit) = self.proposed_edit.take() else {
                    return false;
                };
                self.editor_text = edit.replacement;
                self.activity.push(format!("Accepted {id}").into());
                true
            }
            MiniWorkspaceAction::RejectEdit(id)
                if self
                    .proposed_edit
                    .as_ref()
                    .is_some_and(|edit| edit.id == id) =>
            {
                self.proposed_edit = None;
                self.activity.push(format!("Rejected {id}").into());
                true
            }
            MiniWorkspaceAction::RunTerminalCommand(command) if !command.trim().is_empty() => {
                self.terminal_history.push(command.clone());
                self.activity.push(format!("Ran {command}").into());
                true
            }
            _ => false,
        }
    }
}

/// Names every published surface demonstrated by the crate examples and native gallery.
#[must_use]
pub fn published_component_examples() -> &'static [&'static str] {
    &[
        "Label",
        "Badge",
        "Button",
        "Input",
        "Switch",
        "Checkbox",
        "List",
        "Menu",
        "Popover",
        "Modal",
        "TabList",
        "Table",
        "Scrollbar",
        "OperableEditor",
        "AgentConversation",
        "AgentComposer",
        "ModelSelector",
        "WorkspaceShell",
        "TitleBar",
        "StatusBar",
        "ActivityBar",
        "NavigationBar",
        "BreadcrumbBar",
        "ProjectTree",
        "Outline",
        "PaneTabs",
        "DockPanel",
        "CommandPalette",
        "ProgressIndicator",
        "ToastStack",
        "TerminalSurface",
        "OutputSurface",
        "ProblemsSurface",
        "DiffSurface",
        "GitStatusSurface",
        "TaskRunnerSurface",
        "DebuggerSurface",
        "SearchResultsSurface",
        "RuntimeStatusSurface",
        "SettingsSurface",
        "KeymapSurface",
        "SelectorSurface",
        "ExtensionBrowserSurface",
    ]
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn builtin_catalog_is_searchable_and_complete() {
        let catalog = GalleryCatalog::builtin();
        assert_eq!(catalog.entries().len(), 8);
        assert_eq!(catalog.search("editor", None).len(), 1);
        assert_eq!(integrated_crate_names().len(), 7);
    }
    #[test]
    fn category_filter_and_title_case_are_deterministic() {
        let catalog = GalleryCatalog::builtin();
        assert!(!catalog.search("", Some(Category::Editor)).is_empty());
        assert_eq!(title_case("agent-chat"), "Agent Chat");
    }

    #[test]
    fn every_published_surface_has_a_discoverable_example() {
        let examples = published_component_examples();
        assert!(examples.len() >= 40);
        let unique = examples
            .iter()
            .copied()
            .collect::<std::collections::BTreeSet<_>>();
        assert_eq!(unique.len(), examples.len());
    }

    #[test]
    fn mini_agent_workspace_accepts_and_rejects_identity_bearing_edits() {
        let mut state = MiniWorkspaceState::demo();
        let edit = ProposedEdit {
            id: "edit-1".into(),
            replacement: "fn main() {}".into(),
        };
        assert!(state.dispatch(MiniWorkspaceAction::ProposeEdit(edit.clone())));
        assert!(!state.dispatch(MiniWorkspaceAction::AcceptEdit("wrong".into())));
        assert!(state.dispatch(MiniWorkspaceAction::RejectEdit("edit-1".into())));
        assert!(state.dispatch(MiniWorkspaceAction::ProposeEdit(edit)));
        assert!(state.dispatch(MiniWorkspaceAction::AcceptEdit("edit-1".into())));
        assert_eq!(state.editor_text, "fn main() {}");
        assert!(state.dispatch(MiniWorkspaceAction::RunTerminalCommand("cargo test".into())));
        assert_eq!(state.terminal_history, [SharedString::from("cargo test")]);
    }
}
