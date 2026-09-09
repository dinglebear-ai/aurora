use std::env;
use std::fs;
use std::process::ExitCode;

use aurora_gpui_registry::{Registry, builtin_registry};

fn main() -> ExitCode {
    match run(env::args().skip(1).collect()) {
        Ok(output) => {
            println!("{output}");
            ExitCode::SUCCESS
        }
        Err(error) => {
            eprintln!("error: {error}");
            ExitCode::FAILURE
        }
    }
}

fn run(args: Vec<String>) -> Result<String, String> {
    let (registry, args) = load_registry(args)?;
    if args.first().is_some_and(|command| command == "materialize") {
        return materialize(&registry, &args[1..]);
    }
    match args.as_slice() {
        [command] if command == "list" => Ok(registry
            .iter()
            .map(|item| {
                format!(
                    "{}\t{}\t{}",
                    item.name,
                    item.version,
                    item.category.as_str()
                )
            })
            .collect::<Vec<_>>()
            .join("\n")),
        [command, name] if command == "show" => {
            let item = registry
                .get(name)
                .ok_or_else(|| format!("unknown component: {name}"))?;
            Ok(format!(
                "{} {}\ncrate: {}\ncategory: {}\ndependencies: {}\nfiles: {}",
                item.name,
                item.version,
                item.crate_name,
                item.category.as_str(),
                item.dependencies
                    .iter()
                    .map(|d| format!("{}@{}", d.component, d.requirement))
                    .collect::<Vec<_>>()
                    .join(", "),
                item.files.len()
            ))
        }
        [command] if command == "validate" => registry
            .validate()
            .map(|()| "valid".into())
            .map_err(|error| error.to_string()),
        [command, names @ ..] if command == "plan" && !names.is_empty() => {
            let names = names.iter().map(String::as_str).collect::<Vec<_>>();
            let plan = registry.plan(&names).map_err(|error| error.to_string())?;
            let mut lines = plan.components.iter().map(|item| format!("component\t{}", item.name)).collect::<Vec<_>>();
            lines.extend(plan.files.iter().map(|file| format!("copy\t{}\t{}", file.source, file.destination)));
            Ok(lines.join("\n"))
        }
        [command] if command == "emit" => Ok(registry.to_manifest()),
        _ => Err(
            "usage: aurora-gpui [--manifest PATH] list|show NAME|validate|plan NAME...|emit|materialize SOURCE_ROOT DEST_ROOT [--write] NAME...".into(),
        ),
    }
}

fn materialize(registry: &Registry, args: &[String]) -> Result<String, String> {
    if args.len() < 3 {
        return Err("materialize requires SOURCE_ROOT DEST_ROOT [--write] NAME...".into());
    }
    let source = std::path::Path::new(&args[0]);
    let destination = std::path::Path::new(&args[1]);
    let write = args[2..].iter().any(|argument| argument == "--write");
    let names = args[2..]
        .iter()
        .filter(|argument| argument.as_str() != "--write")
        .map(String::as_str)
        .collect::<Vec<_>>();
    if names.is_empty() {
        return Err("materialize requires at least one component".into());
    }
    let operations = registry
        .materialize(&names, source, destination, write)
        .map_err(|error| error.to_string())?;
    let mode = if write { "write" } else { "dry-run" };
    Ok(std::iter::once(format!("mode\t{mode}"))
        .chain(operations.iter().map(|operation| {
            format!(
                "copy\t{}\t{}",
                operation.source.display(),
                operation.destination.display()
            )
        }))
        .collect::<Vec<_>>()
        .join("\n"))
}

fn load_registry(mut args: Vec<String>) -> Result<(Registry, Vec<String>), String> {
    if args.first().is_some_and(|arg| arg == "--manifest") {
        if args.len() < 3 {
            return Err("--manifest requires a path and command".into());
        }
        let path = args.remove(1);
        args.remove(0);
        let input =
            fs::read_to_string(&path).map_err(|error| format!("cannot read {path}: {error}"))?;
        Ok((
            Registry::from_manifest(&input).map_err(|error| error.to_string())?,
            args,
        ))
    } else {
        Ok((builtin_registry(), args))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn list_and_plan_are_script_friendly() {
        assert!(
            run(vec!["list".into()])
                .unwrap()
                .contains("editor\t0.1.0\teditor")
        );
        let plan = run(vec!["plan".into(), "agent".into()]).unwrap();
        assert!(plan.starts_with("component\tcore\ncomponent\tagent\n"));
        assert!(plan.contains("copy\tcrates/aurora-gpui-agent/Cargo.toml"));
    }
}
