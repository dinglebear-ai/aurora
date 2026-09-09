//! Application-neutral developer-tool components for Aurora GPUI.
//!
//! Hosts own processes, repositories, debuggers, and navigation. This crate
//! supplies deterministic models, stable actions, and token-backed surfaces.

use std::{collections::BTreeSet, ops::Range, rc::Rc, sync::Arc};

use aurora_gpui_core::AuroraTheme;
use aurora_gpui_editor::{DiagnosticSeverity, Point};
use gpui::{
    AccessibleAction, App, ClickEvent, IntoElement, KeyDownEvent, RenderOnce, SharedString, Window,
    div, prelude::*, px, rems,
};

type ActionHandler = Rc<dyn Fn(DevtoolAction, &ClickEvent, &mut Window, &mut App)>;

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ItemId(pub SharedString);
impl ItemId {
    #[must_use]
    pub fn new(value: impl Into<SharedString>) -> Self {
        Self(value.into())
    }
}

#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub enum LoadState {
    #[default]
    Loading,
    Ready,
    Empty,
    Error(SharedString),
}
impl LoadState {
    pub fn resolve<T>(result: Result<Vec<T>, SharedString>) -> Self {
        match result {
            Ok(items) if items.is_empty() => Self::Empty,
            Ok(_) => Self::Ready,
            Err(message) => Self::Error(message),
        }
    }
}

/// Identity-bearing host intents. Collection actions never use display indices.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum DevtoolAction {
    Open(ItemId),
    Reveal(ItemId),
    Copy(ItemId),
    Remove(ItemId),
    Stage(ItemId),
    Unstage(ItemId),
    Revert(ItemId),
    ApplyHunk(ItemId),
    DiscardHunk(ItemId),
    Run(ItemId),
    Stop(ItemId),
    Restart(ItemId),
    DebugContinue,
    DebugPause,
    DebugStepOver,
    DebugStepInto,
    DebugStepOut,
    ToggleBreakpoint(ItemId),
    Select(ItemId),
    Search(SharedString),
    SubmitTerminal(SharedString),
    EditTerminal(TerminalKeyDecision),
    UpdateSetting(ItemId),
    ResetSetting(ItemId),
    UpdateKeybinding(ItemId),
    RemoveKeybinding(ItemId),
    Choose(ItemId),
    InstallExtension(ItemId),
    UpdateExtension(ItemId),
    EnableExtension(ItemId),
    DisableExtension(ItemId),
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum SelectionMove {
    Previous,
    #[default]
    Next,
    First,
    Last,
}

#[must_use]
pub fn move_selection(
    items: &[(ItemId, bool)],
    selected: Option<&ItemId>,
    movement: SelectionMove,
) -> Option<ItemId> {
    let enabled: Vec<_> = items.iter().filter(|(_, disabled)| !disabled).collect();
    if enabled.is_empty() {
        return None;
    }
    let current = selected.and_then(|id| enabled.iter().position(|(candidate, _)| candidate == id));
    let index = match movement {
        SelectionMove::First => 0,
        SelectionMove::Last => enabled.len() - 1,
        SelectionMove::Next => current.map_or(0, |index| (index + 1) % enabled.len()),
        SelectionMove::Previous => current.map_or(enabled.len() - 1, |index| {
            index.checked_sub(1).unwrap_or(enabled.len() - 1)
        }),
    };
    Some(enabled[index].0.clone())
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum TerminalColor {
    #[default]
    Default,
    Primary,
    Muted,
    Success,
    Warning,
    Danger,
    Info,
}
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct CellStyle {
    pub foreground: TerminalColor,
    pub background: TerminalColor,
    pub bold: bool,
    pub italic: bool,
    pub underline: bool,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct TerminalCell {
    pub text: SharedString,
    pub style: CellStyle,
}
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct TerminalLine {
    pub cells: Vec<TerminalCell>,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct TerminalCellRenderPlan {
    pub text: SharedString,
    pub style: CellStyle,
    pub cursor: bool,
}
#[must_use]
pub fn terminal_render_plan(model: &TerminalModel) -> Vec<Vec<TerminalCellRenderPlan>> {
    model
        .lines
        .iter()
        .enumerate()
        .map(|(row, line)| {
            let cursor_column = model
                .cursor
                .filter(|(cursor_row, _)| *cursor_row == row)
                .map(|(_, column)| column);
            let mut column = 0;
            line.cells
                .iter()
                .map(|cell| {
                    let cursor = cursor_column.is_some_and(|cursor| {
                        cursor >= column && cursor < column + cell.text.chars().count().max(1)
                    });
                    column += cell.text.chars().count();
                    TerminalCellRenderPlan {
                        text: cell.text.clone(),
                        style: cell.style,
                        cursor,
                    }
                })
                .collect()
        })
        .collect()
}
pub trait TerminalBackend: Send + Sync {
    fn write(&self, input: &str);
    fn resize(&self, columns: u16, rows: u16);
    fn interrupt(&self);
}
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct TerminalCommand {
    pub text: String,
    pub cursor: usize,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum TerminalKeyDecision {
    Insert(SharedString),
    Backspace,
    MoveLeft,
    MoveRight,
    Submit,
    Interrupt,
    Ignore,
}
#[must_use]
pub fn terminal_key_decision(event: &KeyDownEvent) -> TerminalKeyDecision {
    let key = event.keystroke.key.as_str();
    if event.keystroke.modifiers.control && key == "c" {
        return TerminalKeyDecision::Interrupt;
    }
    match key {
        "enter" => TerminalKeyDecision::Submit,
        "backspace" => TerminalKeyDecision::Backspace,
        "left" => TerminalKeyDecision::MoveLeft,
        "right" => TerminalKeyDecision::MoveRight,
        _ if event.keystroke.modifiers.control
            || event.keystroke.modifiers.platform
            || event.keystroke.modifiers.alt =>
        {
            TerminalKeyDecision::Ignore
        }
        _ => event
            .keystroke
            .key_char
            .clone()
            .map_or(TerminalKeyDecision::Ignore, |text| {
                TerminalKeyDecision::Insert(text.into())
            }),
    }
}
impl TerminalCommand {
    pub fn apply(&mut self, decision: &TerminalKeyDecision) {
        self.cursor = clamp_char_boundary(&self.text, self.cursor);
        match decision {
            TerminalKeyDecision::Insert(text) => {
                self.text.insert_str(self.cursor, text);
                self.cursor += text.len();
            }
            TerminalKeyDecision::Backspace if self.cursor > 0 => {
                let previous = previous_char_boundary(&self.text, self.cursor);
                self.text.replace_range(previous..self.cursor, "");
                self.cursor = previous;
            }
            TerminalKeyDecision::MoveLeft => {
                self.cursor = previous_char_boundary(&self.text, self.cursor);
            }
            TerminalKeyDecision::MoveRight => {
                self.cursor = next_char_boundary(&self.text, self.cursor);
            }
            _ => {}
        }
    }
}

fn clamp_char_boundary(text: &str, cursor: usize) -> usize {
    let mut cursor = cursor.min(text.len());
    while cursor > 0 && !text.is_char_boundary(cursor) {
        cursor -= 1;
    }
    cursor
}
fn previous_char_boundary(text: &str, cursor: usize) -> usize {
    text[..clamp_char_boundary(text, cursor)]
        .char_indices()
        .next_back()
        .map_or(0, |(index, _)| index)
}
fn next_char_boundary(text: &str, cursor: usize) -> usize {
    let cursor = clamp_char_boundary(text, cursor);
    text[cursor..]
        .chars()
        .next()
        .map_or(cursor, |character| cursor + character.len_utf8())
}
#[derive(Clone)]
pub struct TerminalModel {
    pub id: ItemId,
    pub title: SharedString,
    pub state: LoadState,
    pub lines: Arc<[TerminalLine]>,
    pub cursor: Option<(usize, usize)>,
    pub command: TerminalCommand,
    pub backend: Arc<dyn TerminalBackend>,
}
impl TerminalModel {
    pub fn submit(&self, input: &str) -> DevtoolAction {
        self.backend.write(input);
        DevtoolAction::SubmitTerminal(input.to_owned().into())
    }
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, PartialOrd, Ord)]
pub enum LogLevel {
    Trace,
    Debug,
    #[default]
    Information,
    Warning,
    Error,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct LogEntry {
    pub id: ItemId,
    pub level: LogLevel,
    pub timestamp: SharedString,
    pub source: SharedString,
    pub message: SharedString,
}
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct OutputModel {
    pub title: SharedString,
    pub state: LoadState,
    pub entries: Vec<LogEntry>,
    pub visible_levels: BTreeSet<LogLevel>,
    pub follow: bool,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Problem {
    pub id: ItemId,
    pub severity: DiagnosticSeverity,
    pub path: SharedString,
    pub position: Point,
    pub message: SharedString,
    pub source: Option<SharedString>,
}
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct ProblemsModel {
    pub state: LoadState,
    pub problems: Vec<Problem>,
    pub selected: Option<ItemId>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum DiffLineKind {
    Context,
    Added,
    Removed,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct DiffLine {
    pub old_line: Option<usize>,
    pub new_line: Option<usize>,
    pub kind: DiffLineKind,
    pub text: SharedString,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct DiffHunk {
    pub id: ItemId,
    pub header: SharedString,
    pub lines: Vec<DiffLine>,
    pub can_apply: bool,
    pub can_discard: bool,
}
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct DiffModel {
    pub path: SharedString,
    pub state: LoadState,
    pub hunks: Vec<DiffHunk>,
}
#[must_use]
pub fn diff_actions(hunk: &DiffHunk) -> Vec<DevtoolAction> {
    let mut actions = Vec::new();
    if hunk.can_apply {
        actions.push(DevtoolAction::ApplyHunk(hunk.id.clone()));
    }
    if hunk.can_discard {
        actions.push(DevtoolAction::DiscardHunk(hunk.id.clone()));
    }
    actions
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ChangeKind {
    Added,
    Modified,
    Deleted,
    Renamed,
    Untracked,
    Conflicted,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct FileChange {
    pub id: ItemId,
    pub path: SharedString,
    pub kind: ChangeKind,
    pub staged: bool,
}
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct GitStatusModel {
    pub branch: SharedString,
    pub ahead: usize,
    pub behind: usize,
    pub state: LoadState,
    pub changes: Vec<FileChange>,
    pub selected: Option<ItemId>,
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum TaskState {
    #[default]
    Idle,
    Running,
    Succeeded,
    Failed,
    Cancelled,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct TaskItem {
    pub id: ItemId,
    pub label: SharedString,
    pub detail: Option<SharedString>,
    pub state: TaskState,
    pub output: Vec<LogEntry>,
}
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct TaskRunnerModel {
    pub state: LoadState,
    pub tasks: Vec<TaskItem>,
    pub selected: Option<ItemId>,
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum DebugState {
    #[default]
    Disconnected,
    Running,
    Paused,
    Stopped,
    Error,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct StackFrame {
    pub id: ItemId,
    pub name: SharedString,
    pub path: SharedString,
    pub position: Point,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct DebugVariable {
    pub id: ItemId,
    pub name: SharedString,
    pub value: SharedString,
    pub type_name: Option<SharedString>,
    pub depth: usize,
    pub expandable: bool,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Breakpoint {
    pub id: ItemId,
    pub path: SharedString,
    pub position: Point,
    pub enabled: bool,
    pub verified: bool,
}
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct DebuggerModel {
    pub state: DebugState,
    pub status_message: Option<SharedString>,
    pub frames: Vec<StackFrame>,
    pub variables: Vec<DebugVariable>,
    pub breakpoints: Vec<Breakpoint>,
    pub selected_frame: Option<ItemId>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct SearchResult {
    pub id: ItemId,
    pub path: SharedString,
    pub position: Point,
    pub preview: SharedString,
    pub ranges: Vec<Range<usize>>,
}
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct SearchResultsModel {
    pub query: SharedString,
    pub state: LoadState,
    pub results: Vec<SearchResult>,
    pub selected: Option<ItemId>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum RuntimeHealth {
    Connected,
    Connecting,
    Degraded,
    Disconnected,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct RuntimeStatus {
    pub id: ItemId,
    pub label: SharedString,
    pub detail: SharedString,
    pub health: RuntimeHealth,
    pub latency_ms: Option<u64>,
}
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct RuntimeStatusModel {
    pub state: LoadState,
    pub runtimes: Vec<RuntimeStatus>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum SettingValue {
    Boolean(bool),
    Text(SharedString),
    Number(i64),
    Choice(ItemId),
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct SettingItem {
    pub id: ItemId,
    pub label: SharedString,
    pub description: SharedString,
    pub value: SettingValue,
    pub modified: bool,
    pub read_only: bool,
}
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct SettingsModel {
    pub state: LoadState,
    pub query: SharedString,
    pub settings: Vec<SettingItem>,
    pub selected: Option<ItemId>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct KeybindingItem {
    pub id: ItemId,
    pub command: SharedString,
    pub keystrokes: Vec<SharedString>,
    pub context: Option<SharedString>,
    pub conflict_with: Vec<ItemId>,
    pub editable: bool,
}
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct KeymapModel {
    pub state: LoadState,
    pub query: SharedString,
    pub bindings: Vec<KeybindingItem>,
    pub selected: Option<ItemId>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct SelectorOption {
    pub id: ItemId,
    pub label: SharedString,
    pub detail: Option<SharedString>,
    pub disabled: bool,
}
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct SelectorModel {
    pub label: SharedString,
    pub state: LoadState,
    pub options: Vec<SelectorOption>,
    pub selected: Option<ItemId>,
    pub expanded: bool,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ExtensionState {
    NotInstalled,
    Installing,
    Installed,
    Updating,
    Error,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ExtensionItem {
    pub id: ItemId,
    pub name: SharedString,
    pub description: SharedString,
    pub version: SharedString,
    pub state: ExtensionState,
    pub enabled: bool,
    pub update_available: bool,
}
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct ExtensionBrowserModel {
    pub state: LoadState,
    pub query: SharedString,
    pub extensions: Vec<ExtensionItem>,
    pub selected: Option<ItemId>,
}

fn state_message(state: &LoadState, empty: &str) -> Option<SharedString> {
    match state {
        LoadState::Loading => Some("Loading…".into()),
        LoadState::Empty => Some(empty.to_owned().into()),
        LoadState::Error(message) => Some(format!("Error: {message}").into()),
        LoadState::Ready => None,
    }
}

fn panel(
    id: &'static str,
    title: SharedString,
    description: SharedString,
    rows: Vec<gpui::AnyElement>,
    theme: AuroraTheme,
) -> impl IntoElement {
    let surface: gpui::Hsla = theme.colors.surface.into();
    div()
        .id(id)
        .role(gpui::Role::Region)
        .aria_label(title.clone())
        .aria_description(description)
        .flex()
        .flex_col()
        .min_h(px(80.))
        .border_1()
        .border_color(theme.colors.border)
        .rounded(px(theme.radii.md))
        .bg(surface)
        .text_color(theme.colors.text)
        .child(
            div()
                .px(px(theme.space.md))
                .py(px(theme.space.sm))
                .border_b_1()
                .border_color(theme.colors.border)
                .text_size(rems(0.75))
                .child(title),
        )
        .children(rows)
}

#[allow(clippy::too_many_arguments)]
fn row(
    id: &ItemId,
    label: SharedString,
    detail: SharedString,
    theme: AuroraTheme,
    selected: bool,
    enabled: bool,
    action: DevtoolAction,
    handler: Option<ActionHandler>,
) -> gpui::AnyElement {
    let hover: gpui::Hsla = theme.colors.surface_hover.into();
    let active: gpui::Hsla = theme.colors.surface_active.into();
    let mut element = div()
        .id(id.0.clone())
        .role(gpui::Role::ListItem)
        .aria_label(label.clone())
        .aria_selected(selected)
        .when(enabled, |e| e.focusable().tab_index(0).cursor_pointer())
        .when(!enabled, |e| e.opacity(0.45))
        .flex()
        .justify_between()
        .gap(px(theme.space.md))
        .px(px(theme.space.md))
        .py(px(theme.space.sm))
        .when(selected, move |style| style.bg(active))
        .hover(move |style| style.bg(hover))
        .child(label)
        .child(div().text_color(theme.colors.text_muted).child(detail));
    if enabled && let Some(handler) = handler {
        let click = handler.clone();
        let click_action = action.clone();
        let keyboard = handler.clone();
        let keyboard_action = action.clone();
        element = element
            .on_click(move |event, window, cx| click(click_action.clone(), event, window, cx))
            .on_key_down(move |event, window, cx| {
                if matches!(event.keystroke.key.as_str(), "enter" | "space") {
                    keyboard(keyboard_action.clone(), &ClickEvent::default(), window, cx);
                }
            })
            .on_a11y_action(AccessibleAction::Click, move |_, window, cx| {
                handler(action.clone(), &ClickEvent::default(), window, cx);
            });
    }
    element.into_any_element()
}
fn message_row(message: SharedString, theme: AuroraTheme) -> gpui::AnyElement {
    div()
        .id(message.clone())
        .role(gpui::Role::Status)
        .px(px(theme.space.md))
        .py(px(theme.space.lg))
        .text_color(theme.colors.text_muted)
        .child(message)
        .into_any_element()
}

fn terminal_color(color: TerminalColor, theme: AuroraTheme) -> gpui::Hsla {
    match color {
        TerminalColor::Default => theme.colors.text,
        TerminalColor::Primary => theme.colors.primary,
        TerminalColor::Muted => theme.colors.text_muted,
        TerminalColor::Success => theme.colors.success,
        TerminalColor::Warning => theme.colors.warning,
        TerminalColor::Danger => theme.colors.danger,
        TerminalColor::Info => theme.colors.info,
    }
    .into()
}
fn terminal_line(
    id: ItemId,
    cells: Vec<TerminalCellRenderPlan>,
    theme: AuroraTheme,
) -> gpui::AnyElement {
    div()
        .id(id.0)
        .role(gpui::Role::ListItem)
        .flex()
        .px(px(theme.space.md))
        .children(cells.into_iter().map(|cell| {
            let foreground = terminal_color(cell.style.foreground, theme);
            let background = terminal_color(cell.style.background, theme);
            div()
                .text_color(foreground)
                .when(cell.style.background != TerminalColor::Default, move |e| {
                    e.bg(background)
                })
                .when(cell.style.bold, |e| e.font_weight(gpui::FontWeight::BOLD))
                .when(cell.style.italic, gpui::Styled::italic)
                .when(cell.style.underline, gpui::Styled::underline)
                .when(cell.cursor, |e| {
                    e.border_l_1().border_color(theme.colors.primary)
                })
                .child(cell.text)
        }))
        .into_any_element()
}

fn terminal_input(
    model: &TerminalModel,
    theme: AuroraTheme,
    handler: Option<ActionHandler>,
) -> gpui::AnyElement {
    let backend = model.backend.clone();
    let command = model.command.text.clone();
    let mut input = div()
        .id(model.id.0.clone())
        .role(gpui::Role::TextInput)
        .aria_label("Terminal Command")
        .aria_value(command.clone())
        .focusable()
        .tab_index(0)
        .px(px(theme.space.md))
        .py(px(theme.space.sm))
        .border_t_1()
        .border_color(theme.colors.border)
        .child(format!("> {command}"));
    if let Some(handler) = handler {
        input = input.on_key_down(move |event, window, cx| {
            let decision = terminal_key_decision(event);
            match &decision {
                TerminalKeyDecision::Submit => {
                    backend.write(&command);
                    handler(
                        DevtoolAction::SubmitTerminal(command.clone().into()),
                        &ClickEvent::default(),
                        window,
                        cx,
                    );
                }
                TerminalKeyDecision::Interrupt => {
                    backend.interrupt();
                    handler(
                        DevtoolAction::EditTerminal(decision),
                        &ClickEvent::default(),
                        window,
                        cx,
                    );
                }
                TerminalKeyDecision::Ignore => {}
                _ => handler(
                    DevtoolAction::EditTerminal(decision),
                    &ClickEvent::default(),
                    window,
                    cx,
                ),
            }
        });
    }
    input.into_any_element()
}

macro_rules! surface {
    ($name:ident, $model:ty, $id:literal, $title:expr, $desc:expr, $rows:expr) => {
        #[derive(IntoElement)]
        pub struct $name {
            pub model: $model,
            pub theme: AuroraTheme,
            on_action: Option<ActionHandler>,
        }
        impl $name {
            #[must_use]
            pub fn new(model: $model) -> Self {
                Self {
                    model,
                    theme: AuroraTheme::default(),
                    on_action: None,
                }
            }
            #[must_use]
            pub const fn theme(mut self, theme: AuroraTheme) -> Self {
                self.theme = theme;
                self
            }
            #[must_use]
            pub fn on_action(
                mut self,
                handler: impl Fn(DevtoolAction, &ClickEvent, &mut Window, &mut App) + 'static,
            ) -> Self {
                self.on_action = Some(Rc::new(handler));
                self
            }
        }
        impl RenderOnce for $name {
            fn render(self, _window: &mut gpui::Window, _cx: &mut gpui::App) -> impl IntoElement {
                panel(
                    $id,
                    $title(&self.model),
                    $desc(&self.model),
                    $rows(&self.model, self.theme, self.on_action),
                    self.theme,
                )
            }
        }
    };
}

surface!(
    TerminalSurface,
    TerminalModel,
    "aurora-terminal",
    |m: &TerminalModel| m.title.clone(),
    |_m: &TerminalModel| "Terminal output; focus to enter commands".into(),
    |m: &TerminalModel, t, h: Option<ActionHandler>| {
        let mut rows = state_message(&m.state, "Terminal is empty").map_or_else(
            || {
                terminal_render_plan(m)
                    .into_iter()
                    .enumerate()
                    .map(|(i, cells)| {
                        terminal_line(ItemId::new(format!("terminal-line-{i}")), cells, t)
                    })
                    .collect()
            },
            |s| vec![message_row(s, t)],
        );
        rows.push(terminal_input(m, t, h));
        rows
    }
);
surface!(
    OutputSurface,
    OutputModel,
    "aurora-output",
    |m: &OutputModel| m.title.clone(),
    |m: &OutputModel| format!("{} log entries", m.entries.len()).into(),
    |m: &OutputModel, t, h: Option<ActionHandler>| state_message(&m.state, "No output")
        .map_or_else(
            || m.entries
                .iter()
                .map(|e| row(
                    &e.id,
                    e.message.clone(),
                    format!("{} · {}", e.timestamp, e.source).into(),
                    t,
                    false,
                    true,
                    DevtoolAction::Copy(e.id.clone()),
                    h.clone()
                ))
                .collect(),
            |s| vec![message_row(s, t)]
        )
);
surface!(
    ProblemsSurface,
    ProblemsModel,
    "aurora-problems",
    |_m: &ProblemsModel| "Problems".into(),
    |m: &ProblemsModel| format!("{} diagnostics", m.problems.len()).into(),
    |m: &ProblemsModel, t, h: Option<ActionHandler>| state_message(
        &m.state,
        "No problems detected"
    )
    .map_or_else(
        || m.problems
            .iter()
            .map(|p| row(
                &p.id,
                p.message.clone(),
                format!(
                    "{}:{}:{}",
                    p.path,
                    p.position.row + 1,
                    p.position.column + 1
                )
                .into(),
                t,
                m.selected.as_ref() == Some(&p.id),
                true,
                DevtoolAction::Reveal(p.id.clone()),
                h.clone()
            ))
            .collect(),
        |s| vec![message_row(s, t)]
    )
);
surface!(
    DiffSurface,
    DiffModel,
    "aurora-diff",
    |m: &DiffModel| m.path.clone(),
    |m: &DiffModel| format!("{} diff hunks", m.hunks.len()).into(),
    |m: &DiffModel, t, cb: Option<ActionHandler>| state_message(&m.state, "No changes")
        .map_or_else(
            || m.hunks
                .iter()
                .flat_map(|h| [
                    row(
                        &ItemId::new(format!("{}-apply", h.id.0)),
                        h.header.clone(),
                        format!("Apply · {} lines", h.lines.len()).into(),
                        t,
                        false,
                        h.can_apply,
                        DevtoolAction::ApplyHunk(h.id.clone()),
                        cb.clone()
                    ),
                    row(
                        &ItemId::new(format!("{}-discard", h.id.0)),
                        h.header.clone(),
                        format!("Discard · {} lines", h.lines.len()).into(),
                        t,
                        false,
                        h.can_discard,
                        DevtoolAction::DiscardHunk(h.id.clone()),
                        cb.clone()
                    ),
                ])
                .collect(),
            |s| vec![message_row(s, t)]
        )
);
surface!(
    GitStatusSurface,
    GitStatusModel,
    "aurora-git-status",
    |m: &GitStatusModel| format!("Source Control · {}", m.branch).into(),
    |m: &GitStatusModel| format!(
        "{} changes; {} ahead; {} behind",
        m.changes.len(),
        m.ahead,
        m.behind
    )
    .into(),
    |m: &GitStatusModel, t, h: Option<ActionHandler>| state_message(
        &m.state,
        "Working tree is clean"
    )
    .map_or_else(
        || m.changes
            .iter()
            .map(|c| row(
                &c.id,
                c.path.clone(),
                format!("{:?}{}", c.kind, if c.staged { " · Staged" } else { "" }).into(),
                t,
                m.selected.as_ref() == Some(&c.id),
                true,
                if c.staged {
                    DevtoolAction::Unstage(c.id.clone())
                } else {
                    DevtoolAction::Stage(c.id.clone())
                },
                h.clone()
            ))
            .collect(),
        |s| vec![message_row(s, t)]
    )
);
surface!(
    TaskRunnerSurface,
    TaskRunnerModel,
    "aurora-task-runner",
    |_m: &TaskRunnerModel| "Tasks".into(),
    |m: &TaskRunnerModel| format!("{} tasks", m.tasks.len()).into(),
    |m: &TaskRunnerModel, t, h: Option<ActionHandler>| state_message(
        &m.state,
        "No tasks configured"
    )
    .map_or_else(
        || m.tasks
            .iter()
            .map(|x| row(
                &x.id,
                x.label.clone(),
                format!("{:?}", x.state).into(),
                t,
                m.selected.as_ref() == Some(&x.id),
                true,
                if x.state == TaskState::Running {
                    DevtoolAction::Stop(x.id.clone())
                } else {
                    DevtoolAction::Run(x.id.clone())
                },
                h.clone()
            ))
            .collect(),
        |s| vec![message_row(s, t)]
    )
);
surface!(
    DebuggerSurface,
    DebuggerModel,
    "aurora-debugger",
    |_m: &DebuggerModel| "Debugger".into(),
    |m: &DebuggerModel| format!(
        "{:?}; {} frames; {} variables; {} breakpoints",
        m.state,
        m.frames.len(),
        m.variables.len(),
        m.breakpoints.len()
    )
    .into(),
    |m: &DebuggerModel, t, h: Option<ActionHandler>| {
        let paused = m.state == DebugState::Paused;
        let controls = [
            (
                "debug-continue",
                "Continue",
                DevtoolAction::DebugContinue,
                paused,
            ),
            (
                "debug-pause",
                "Pause",
                DevtoolAction::DebugPause,
                m.state == DebugState::Running,
            ),
            (
                "debug-step-over",
                "Step Over",
                DevtoolAction::DebugStepOver,
                paused,
            ),
            (
                "debug-step-into",
                "Step Into",
                DevtoolAction::DebugStepInto,
                paused,
            ),
            (
                "debug-step-out",
                "Step Out",
                DevtoolAction::DebugStepOut,
                paused,
            ),
        ];
        let mut rows: Vec<_> = controls
            .into_iter()
            .map(|(id, label, action, enabled)| {
                row(
                    &ItemId::new(id),
                    label.into(),
                    "Debugger Control".into(),
                    t,
                    false,
                    enabled,
                    action,
                    h.clone(),
                )
            })
            .collect();
        if m.frames.is_empty() {
            rows.push(message_row(
                m.status_message
                    .clone()
                    .unwrap_or_else(|| format!("{:?}", m.state).into()),
                t,
            ));
        }
        rows.extend(m.frames.iter().map(|f| {
            row(
                &f.id,
                f.name.clone(),
                format!("{}:{}", f.path, f.position.row + 1).into(),
                t,
                m.selected_frame.as_ref() == Some(&f.id),
                true,
                DevtoolAction::Select(f.id.clone()),
                h.clone(),
            )
        }));
        rows
    }
);
surface!(
    SearchResultsSurface,
    SearchResultsModel,
    "aurora-search-results",
    |m: &SearchResultsModel| format!("Search · {}", m.query).into(),
    |m: &SearchResultsModel| format!("{} results", m.results.len()).into(),
    |m: &SearchResultsModel, t, h: Option<ActionHandler>| state_message(&m.state, "No results")
        .map_or_else(
            || m.results
                .iter()
                .map(|r| row(
                    &r.id,
                    r.preview.clone(),
                    format!("{}:{}", r.path, r.position.row + 1).into(),
                    t,
                    m.selected.as_ref() == Some(&r.id),
                    true,
                    DevtoolAction::Reveal(r.id.clone()),
                    h.clone()
                ))
                .collect(),
            |s| vec![message_row(s, t)]
        )
);
surface!(
    RuntimeStatusSurface,
    RuntimeStatusModel,
    "aurora-runtime-status",
    |_m: &RuntimeStatusModel| "Runtime Status".into(),
    |m: &RuntimeStatusModel| format!("{} runtimes", m.runtimes.len()).into(),
    |m: &RuntimeStatusModel, t, h: Option<ActionHandler>| state_message(
        &m.state,
        "No runtimes configured"
    )
    .map_or_else(
        || m.runtimes
            .iter()
            .map(|r| row(
                &r.id,
                r.label.clone(),
                format!("{:?} · {}", r.health, r.detail).into(),
                t,
                false,
                r.health != RuntimeHealth::Disconnected,
                DevtoolAction::Select(r.id.clone()),
                h.clone()
            ))
            .collect(),
        |s| vec![message_row(s, t)]
    )
);

surface!(
    SettingsSurface,
    SettingsModel,
    "aurora-settings",
    |_m: &SettingsModel| "Settings".into(),
    |m: &SettingsModel| format!("{} settings matching {}", m.settings.len(), m.query).into(),
    |m: &SettingsModel, t, h: Option<ActionHandler>| state_message(&m.state, "No settings found")
        .map_or_else(
            || m.settings
                .iter()
                .flat_map(|s| [
                    row(
                        &ItemId::new(format!("{}-edit", s.id.0)),
                        s.label.clone(),
                        s.description.clone(),
                        t,
                        m.selected.as_ref() == Some(&s.id),
                        !s.read_only,
                        DevtoolAction::UpdateSetting(s.id.clone()),
                        h.clone()
                    ),
                    row(
                        &ItemId::new(format!("{}-reset", s.id.0)),
                        "Reset".into(),
                        s.label.clone(),
                        t,
                        false,
                        !s.read_only && s.modified,
                        DevtoolAction::ResetSetting(s.id.clone()),
                        h.clone()
                    ),
                ])
                .collect(),
            |s| vec![message_row(s, t)]
        )
);
surface!(
    KeymapSurface,
    KeymapModel,
    "aurora-keymap",
    |_m: &KeymapModel| "Keymap".into(),
    |m: &KeymapModel| format!("{} bindings matching {}", m.bindings.len(), m.query).into(),
    |m: &KeymapModel, t, h: Option<ActionHandler>| state_message(&m.state, "No keybindings found")
        .map_or_else(
            || m.bindings
                .iter()
                .flat_map(|b| {
                    let detail: SharedString = format!(
                        "{}{}",
                        b.keystrokes
                            .iter()
                            .map(AsRef::as_ref)
                            .collect::<Vec<_>>()
                            .join(" "),
                        if b.conflict_with.is_empty() {
                            ""
                        } else {
                            " · Conflict"
                        }
                    )
                    .into();
                    [
                        row(
                            &ItemId::new(format!("{}-edit", b.id.0)),
                            b.command.clone(),
                            detail,
                            t,
                            m.selected.as_ref() == Some(&b.id),
                            b.editable,
                            DevtoolAction::UpdateKeybinding(b.id.clone()),
                            h.clone(),
                        ),
                        row(
                            &ItemId::new(format!("{}-remove", b.id.0)),
                            "Remove Binding".into(),
                            b.command.clone(),
                            t,
                            false,
                            b.editable && !b.keystrokes.is_empty(),
                            DevtoolAction::RemoveKeybinding(b.id.clone()),
                            h.clone(),
                        ),
                    ]
                })
                .collect(),
            |s| vec![message_row(s, t)]
        )
);
surface!(
    SelectorSurface,
    SelectorModel,
    "aurora-selector",
    |m: &SelectorModel| m.label.clone(),
    |m: &SelectorModel| if m.expanded {
        "Expanded selector".into()
    } else {
        "Collapsed selector".into()
    },
    |m: &SelectorModel, t, h: Option<ActionHandler>| state_message(&m.state, "No options")
        .map_or_else(
            || m.options
                .iter()
                .map(|o| row(
                    &o.id,
                    o.label.clone(),
                    o.detail.clone().unwrap_or_default(),
                    t,
                    m.selected.as_ref() == Some(&o.id),
                    !o.disabled,
                    DevtoolAction::Choose(o.id.clone()),
                    h.clone()
                ))
                .collect(),
            |s| vec![message_row(s, t)]
        )
);
surface!(
    ExtensionBrowserSurface,
    ExtensionBrowserModel,
    "aurora-extensions",
    |_m: &ExtensionBrowserModel| "Extensions".into(),
    |m: &ExtensionBrowserModel| format!("{} extensions matching {}", m.extensions.len(), m.query)
        .into(),
    |m: &ExtensionBrowserModel, t, h: Option<ActionHandler>| state_message(
        &m.state,
        "No extensions found"
    )
    .map_or_else(
        || m.extensions
            .iter()
            .map(|e| {
                let (enabled, action) = match e.state {
                    ExtensionState::Installing | ExtensionState::Updating => {
                        (false, DevtoolAction::Select(e.id.clone()))
                    }
                    ExtensionState::NotInstalled => {
                        (true, DevtoolAction::InstallExtension(e.id.clone()))
                    }
                    ExtensionState::Installed if e.update_available => {
                        (true, DevtoolAction::UpdateExtension(e.id.clone()))
                    }
                    ExtensionState::Installed if e.enabled => {
                        (true, DevtoolAction::DisableExtension(e.id.clone()))
                    }
                    ExtensionState::Installed | ExtensionState::Error => {
                        (true, DevtoolAction::EnableExtension(e.id.clone()))
                    }
                };
                row(
                    &e.id,
                    e.name.clone(),
                    format!("{} · {} · {:?}", e.version, e.description, e.state).into(),
                    t,
                    m.selected.as_ref() == Some(&e.id),
                    enabled,
                    action,
                    h.clone(),
                )
            })
            .collect(),
        |s| vec![message_row(s, t)]
    )
);

#[cfg(test)]
mod tests {
    use super::*;
    struct RecordingTerminal(std::sync::Mutex<Vec<String>>);
    impl TerminalBackend for RecordingTerminal {
        fn write(&self, input: &str) {
            self.0
                .lock()
                .expect("terminal lock poisoned")
                .push(input.to_owned());
        }
        fn resize(&self, _: u16, _: u16) {}
        fn interrupt(&self) {}
    }
    #[test]
    fn selection_uses_identity_and_skips_disabled_rows() {
        let a = ItemId::new("a");
        let b = ItemId::new("b");
        let c = ItemId::new("c");
        let items = vec![(a.clone(), false), (b, true), (c.clone(), false)];
        assert_eq!(
            move_selection(&items, Some(&a), SelectionMove::Next),
            Some(c.clone())
        );
        assert_eq!(
            move_selection(&items, Some(&c), SelectionMove::Next),
            Some(a)
        );
    }
    #[test]
    fn terminal_submission_crosses_backend_boundary() {
        let backend = Arc::new(RecordingTerminal(std::sync::Mutex::new(Vec::new())));
        let model = TerminalModel {
            id: ItemId::new("terminal"),
            title: "Shell".into(),
            state: LoadState::Ready,
            lines: Arc::from([]),
            cursor: None,
            command: TerminalCommand::default(),
            backend: backend.clone(),
        };
        assert_eq!(
            model.submit("cargo test\n"),
            DevtoolAction::SubmitTerminal("cargo test\n".into())
        );
        assert_eq!(
            backend.0.lock().expect("terminal lock poisoned").as_slice(),
            &["cargo test\n"]
        );
    }
    #[test]
    fn async_states_have_explicit_copy() {
        assert_eq!(
            state_message(&LoadState::Loading, "empty"),
            Some("Loading…".into())
        );
        assert_eq!(
            state_message(&LoadState::Empty, "empty"),
            Some("empty".into())
        );
        assert_eq!(
            state_message(&LoadState::Error("offline".into()), "empty"),
            Some("Error: offline".into())
        );
        assert_eq!(state_message(&LoadState::Ready, "empty"), None);
    }
    #[test]
    fn terminal_command_editing_is_deterministic() {
        let mut command = TerminalCommand::default();
        command.apply(&TerminalKeyDecision::Insert("abc".into()));
        command.apply(&TerminalKeyDecision::MoveLeft);
        command.apply(&TerminalKeyDecision::Backspace);
        assert_eq!(
            command,
            TerminalCommand {
                text: "ac".into(),
                cursor: 1
            }
        );
    }
    #[test]
    fn async_results_transition_to_ready_empty_or_error() {
        assert_eq!(
            LoadState::resolve(Ok::<_, SharedString>(vec![1])),
            LoadState::Ready
        );
        assert_eq!(
            LoadState::resolve(Ok::<_, SharedString>(Vec::<u8>::new())),
            LoadState::Empty
        );
        assert_eq!(
            LoadState::resolve::<u8>(Err("offline".into())),
            LoadState::Error("offline".into())
        );
    }
    #[test]
    fn identity_bearing_actions_do_not_depend_on_position() {
        let id = ItemId::new("extension.aurora");
        let actions = [
            DevtoolAction::InstallExtension(id.clone()),
            DevtoolAction::UpdateExtension(id.clone()),
            DevtoolAction::DisableExtension(id.clone()),
        ];
        assert!(actions.iter().all(|action| match action {
            DevtoolAction::InstallExtension(found)
            | DevtoolAction::UpdateExtension(found)
            | DevtoolAction::DisableExtension(found) => found == &id,
            _ => false,
        }));
    }
    #[test]
    fn terminal_cursor_respects_utf8_boundaries() {
        let mut command = TerminalCommand {
            text: "é🙂z".into(),
            cursor: 99,
        };
        command.apply(&TerminalKeyDecision::MoveLeft);
        assert_eq!(command.cursor, "é🙂".len());
        command.apply(&TerminalKeyDecision::Backspace);
        assert_eq!(command.text, "éz");
        assert_eq!(command.cursor, "é".len());
        command.cursor = 1;
        command.apply(&TerminalKeyDecision::MoveRight);
        assert_eq!(command.cursor, "é".len());
    }
    #[test]
    fn discard_only_hunk_has_an_operable_discard_plan() {
        let hunk = DiffHunk {
            id: ItemId::new("h1"),
            header: "@@".into(),
            lines: Vec::new(),
            can_apply: false,
            can_discard: true,
        };
        assert_eq!(
            diff_actions(&hunk),
            vec![DevtoolAction::DiscardHunk(hunk.id)]
        );
    }
    #[test]
    fn terminal_render_plan_preserves_style_and_cursor() {
        let backend = Arc::new(RecordingTerminal(std::sync::Mutex::new(Vec::new())));
        let style = CellStyle {
            foreground: TerminalColor::Danger,
            bold: true,
            ..Default::default()
        };
        let model = TerminalModel {
            id: ItemId::new("terminal"),
            title: "Shell".into(),
            state: LoadState::Ready,
            lines: Arc::from([TerminalLine {
                cells: vec![TerminalCell {
                    text: "oops".into(),
                    style,
                }],
            }]),
            cursor: Some((0, 2)),
            command: TerminalCommand::default(),
            backend,
        };
        let plan = terminal_render_plan(&model);
        assert_eq!(plan[0][0].style, style);
        assert!(plan[0][0].cursor);
    }
}
