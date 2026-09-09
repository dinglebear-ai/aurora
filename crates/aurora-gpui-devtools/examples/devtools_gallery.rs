//! Compile-checked construction of every developer-tool render boundary.

use std::sync::Arc;

use aurora_gpui_devtools::{
    DebuggerModel, DebuggerSurface, DiffModel, DiffSurface, ExtensionBrowserModel,
    ExtensionBrowserSurface, GitStatusModel, GitStatusSurface, ItemId, KeymapModel, KeymapSurface,
    LoadState, OutputModel, OutputSurface, ProblemsModel, ProblemsSurface, RuntimeStatusModel,
    RuntimeStatusSurface, SearchResultsModel, SearchResultsSurface, SelectorModel, SelectorSurface,
    SettingsModel, SettingsSurface, TaskRunnerModel, TaskRunnerSurface, TerminalBackend,
    TerminalCommand, TerminalModel, TerminalSurface,
};
use aurora_gpui_workspace::WorkspaceShell;
use gpui::{App, IntoElement, RenderOnce, Window};

struct DemoTerminal;
impl TerminalBackend for DemoTerminal {
    fn write(&self, _input: &str) {}
    fn resize(&self, _columns: u16, _rows: u16) {}
    fn interrupt(&self) {}
}

fn main() {
    let terminal = TerminalSurface::new(TerminalModel {
        id: ItemId::new("terminal"),
        title: "Terminal".into(),
        state: LoadState::Empty,
        lines: Arc::from([]),
        cursor: None,
        command: TerminalCommand::default(),
        backend: Arc::new(DemoTerminal),
    });
    let output = OutputSurface::new(OutputModel {
        title: "Output".into(),
        state: LoadState::Empty,
        ..Default::default()
    });
    let problems = ProblemsSurface::new(ProblemsModel {
        state: LoadState::Empty,
        ..Default::default()
    });
    let diff = DiffSurface::new(DiffModel {
        path: "src/main.rs".into(),
        state: LoadState::Empty,
        ..Default::default()
    });
    let git = GitStatusSurface::new(GitStatusModel {
        branch: "main".into(),
        state: LoadState::Empty,
        ..Default::default()
    });
    let tasks = TaskRunnerSurface::new(TaskRunnerModel {
        state: LoadState::Empty,
        ..Default::default()
    });
    let debugger = DebuggerSurface::new(DebuggerModel::default());
    let search = SearchResultsSurface::new(SearchResultsModel {
        query: "Aurora".into(),
        state: LoadState::Empty,
        ..Default::default()
    });
    let runtime = RuntimeStatusSurface::new(RuntimeStatusModel {
        state: LoadState::Empty,
        ..Default::default()
    });
    let settings = SettingsSurface::new(SettingsModel {
        state: LoadState::Empty,
        ..Default::default()
    });
    let keymap = KeymapSurface::new(KeymapModel {
        state: LoadState::Empty,
        ..Default::default()
    });
    let selector = SelectorSurface::new(SelectorModel {
        label: "Theme".into(),
        state: LoadState::Empty,
        ..Default::default()
    });
    let extensions = ExtensionBrowserSurface::new(ExtensionBrowserModel {
        state: LoadState::Empty,
        ..Default::default()
    });
    let shell = WorkspaceShell::new("devtools-shell", "Aurora Developer Tools").pane_tree(
        ProblemsSurface::new(ProblemsModel {
            state: LoadState::Empty,
            ..Default::default()
        }),
    );
    let _catalog = (
        terminal, output, problems, diff, git, tasks, debugger, search, runtime, settings, keymap,
        selector, extensions, shell,
    );
}

/// Proves every family crosses the real `RenderOnce` boundary.
pub fn render_harness(window: &mut Window, app: &mut App) {
    let surfaces = [
        TerminalSurface::new(TerminalModel {
            id: ItemId::new("terminal"),
            title: "Terminal".into(),
            state: LoadState::Empty,
            lines: Arc::from([]),
            cursor: None,
            command: TerminalCommand::default(),
            backend: Arc::new(DemoTerminal),
        })
        .render(window, app)
        .into_any_element(),
        SettingsSurface::new(SettingsModel {
            state: LoadState::Empty,
            ..Default::default()
        })
        .render(window, app)
        .into_any_element(),
        KeymapSurface::new(KeymapModel {
            state: LoadState::Empty,
            ..Default::default()
        })
        .render(window, app)
        .into_any_element(),
        SelectorSurface::new(SelectorModel {
            label: "Theme".into(),
            state: LoadState::Empty,
            ..Default::default()
        })
        .render(window, app)
        .into_any_element(),
        ExtensionBrowserSurface::new(ExtensionBrowserModel {
            state: LoadState::Empty,
            ..Default::default()
        })
        .render(window, app)
        .into_any_element(),
        OutputSurface::new(OutputModel {
            title: "Output".into(),
            state: LoadState::Empty,
            ..Default::default()
        })
        .render(window, app)
        .into_any_element(),
        ProblemsSurface::new(ProblemsModel {
            state: LoadState::Empty,
            ..Default::default()
        })
        .render(window, app)
        .into_any_element(),
        DiffSurface::new(DiffModel {
            path: "src/main.rs".into(),
            state: LoadState::Empty,
            ..Default::default()
        })
        .render(window, app)
        .into_any_element(),
        GitStatusSurface::new(GitStatusModel {
            branch: "main".into(),
            state: LoadState::Empty,
            ..Default::default()
        })
        .render(window, app)
        .into_any_element(),
        TaskRunnerSurface::new(TaskRunnerModel {
            state: LoadState::Empty,
            ..Default::default()
        })
        .render(window, app)
        .into_any_element(),
        DebuggerSurface::new(DebuggerModel::default())
            .render(window, app)
            .into_any_element(),
        SearchResultsSurface::new(SearchResultsModel {
            query: "Aurora".into(),
            state: LoadState::Empty,
            ..Default::default()
        })
        .render(window, app)
        .into_any_element(),
        RuntimeStatusSurface::new(RuntimeStatusModel {
            state: LoadState::Empty,
            ..Default::default()
        })
        .render(window, app)
        .into_any_element(),
    ];
    let _ = surfaces;
    let shell = WorkspaceShell::new("rendered-devtools-shell", "Aurora Developer Tools").pane_tree(
        ProblemsSurface::new(ProblemsModel {
            state: LoadState::Empty,
            ..Default::default()
        }),
    );
    let _ = shell.render(window, app).into_any_element();
}
