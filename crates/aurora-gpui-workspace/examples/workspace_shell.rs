use aurora_gpui_workspace::{
    ActivityBar, Breadcrumb, BreadcrumbBar, CommandPalette, DockPanel, DockPosition, ItemTab,
    NavigationBar, PaletteItem, PaneState, PaneTabs, PanelState, ProgressIndicator, ProjectEntry,
    ProjectTree, StatusBar, TaskStatus, TitleBar, Toast, ToastStack, ToastTone, WorkspaceShell,
};
use gpui::{div, prelude::*};

fn main() {
    // Construction crosses every RenderOnce boundary without requiring an app-owned model.
    let _shell = WorkspaceShell::new("shell", "Aurora")
        .activity(div().child("Activities"))
        .left_panel(div().child("Project Tree"))
        .pane_tree(
            div()
                .child(div().child("Editor Slot"))
                .child(div().child("Agent Slot")),
        )
        .right_panel(div().child("Outline"))
        .bottom_panel(div().child("Terminal"))
        .palette(div().child("Quick Open"))
        .notifications(div().child("Saved"))
        .progress(div().child("Indexing"));
    let _title = TitleBar::new("title", "Aurora Workspace");
    let _status = StatusBar::new("status")
        .items(["main", "Ln 1, Col 1"])
        .tasks([TaskStatus {
            id: "build".into(),
            label: "Building".into(),
            percent: Some(42),
            cancellable: true,
        }]);
    let _activity = ActivityBar::new("activity")
        .items([("files", "Files"), ("search", "Search")])
        .active("files");
    let _breadcrumbs = BreadcrumbBar::new("crumbs").crumbs([
        Breadcrumb {
            label: "src".into(),
            path: "src".into(),
        },
        Breadcrumb {
            label: "main.rs".into(),
            path: "src/main.rs".into(),
        },
    ]);
    let _navigation = NavigationBar::new("navigation").history(true, false);
    let _tree = ProjectTree::new("tree").entries([
        ProjectEntry {
            id: "src".into(),
            label: "src".into(),
            depth: 0,
            directory: true,
            expanded: true,
            selected: false,
        },
        ProjectEntry {
            id: "main".into(),
            label: "main.rs".into(),
            depth: 1,
            directory: false,
            expanded: false,
            selected: true,
        },
    ]);
    let mut pane = PaneState::new("main");
    pane.tabs.push(ItemTab::new("main", "main.rs"));
    pane.active = Some("main".into());
    let _tabs = PaneTabs::new("tabs", pane);
    let _panel = DockPanel::new(
        "project",
        "Project",
        PanelState::new("project", DockPosition::Left, 240.),
    )
    .on_action(|_, _, _| {});
    let _palette = CommandPalette::new("palette")
        .query("file")
        .items([PaletteItem {
            id: "open".into(),
            label: "Open File".into(),
            detail: Some("Project".into()),
        }])
        .on_action(|_, _, _| {});
    let _toasts = ToastStack::new("toasts")
        .toasts([Toast {
            id: "saved".into(),
            message: "Saved".into(),
            tone: ToastTone::Success,
        }])
        .on_action(|_, _, _| {});
    let _progress = ProgressIndicator::new(
        "progress",
        TaskStatus {
            id: "index".into(),
            label: "Indexing".into(),
            percent: None,
            cancellable: false,
        },
    )
    .on_action(|_, _, _| {});
}
