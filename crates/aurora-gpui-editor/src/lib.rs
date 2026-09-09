//! Application-neutral editing components for Aurora GPUI.
//!
//! The text model is separate from presentation. Applications provide language
//! intelligence through small traits without adopting Aurora-owned project state.

use std::{
    cmp::Ordering,
    fmt::Write as _,
    ops::Range,
    sync::{Arc, Mutex},
};

use aurora_gpui_core::AuroraTheme;
use gpui::{
    App, FocusHandle, IntoElement, KeyDownEvent, Modifiers, MouseButton, MouseDownEvent,
    RenderOnce, ScrollWheelEvent, SharedString, Window, div, prelude::*, px, rems,
};

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, PartialOrd, Ord)]
pub struct Point {
    pub row: usize,
    pub column: usize,
}
impl Point {
    #[must_use]
    pub const fn new(row: usize, column: usize) -> Self {
        Self { row, column }
    }
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct Selection {
    pub anchor: Point,
    pub head: Point,
}
impl Selection {
    #[must_use]
    pub const fn cursor(point: Point) -> Self {
        Self {
            anchor: point,
            head: point,
        }
    }
    #[must_use]
    pub fn ordered(self) -> Range<Point> {
        if self.anchor.cmp(&self.head) == Ordering::Greater {
            self.head..self.anchor
        } else {
            self.anchor..self.head
        }
    }
    #[must_use]
    pub const fn is_cursor(self) -> bool {
        self.anchor.row == self.head.row && self.anchor.column == self.head.column
    }
}

pub trait TextBuffer: Send + Sync {
    fn text(&self) -> &str;
    fn replace(&mut self, range: Range<usize>, text: &str);
}

#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct StringBuffer(String);
impl StringBuffer {
    #[must_use]
    pub fn new(text: impl Into<String>) -> Self {
        Self(text.into())
    }
}
impl TextBuffer for StringBuffer {
    fn text(&self) -> &str {
        &self.0
    }
    fn replace(&mut self, range: Range<usize>, text: &str) {
        self.0.replace_range(range, text);
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum DiagnosticSeverity {
    Error,
    Warning,
    Information,
    Hint,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Diagnostic {
    pub range: Range<Point>,
    pub severity: DiagnosticSeverity,
    pub message: SharedString,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Completion {
    pub label: SharedString,
    pub detail: Option<SharedString>,
    pub replacement: SharedString,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Hover {
    pub range: Option<Range<Point>>,
    pub contents: SharedString,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Inlay {
    pub position: Point,
    pub label: SharedString,
}

pub trait CompletionProvider: Send + Sync {
    fn completions(&self, text: &str, cursor: Point) -> Vec<Completion>;
}
pub trait HoverProvider: Send + Sync {
    fn hover(&self, text: &str, position: Point) -> Option<Hover>;
}
pub trait DiagnosticProvider: Send + Sync {
    fn diagnostics(&self, text: &str) -> Vec<Diagnostic>;
}
pub trait InlayProvider: Send + Sync {
    fn inlays(&self, text: &str, visible_rows: Range<usize>) -> Vec<Inlay>;
}

#[derive(Default)]
pub struct EditorProviders {
    pub completion: Option<Arc<dyn CompletionProvider>>,
    pub hover: Option<Arc<dyn HoverProvider>>,
    pub diagnostics: Option<Arc<dyn DiagnosticProvider>>,
    pub inlays: Option<Arc<dyn InlayProvider>>,
}

pub trait EditorExtension: Send + Sync {
    fn decorate(&self, snapshot: &EditorSnapshot) -> Vec<Decoration>;
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Decoration {
    pub range: Range<Point>,
    pub label: SharedString,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct EditorSnapshot {
    pub text: Arc<str>,
    pub selections: Arc<[Selection]>,
    pub visible_rows: Range<usize>,
    pub folded_rows: Arc<[Range<usize>]>,
    pub search_query: Option<SharedString>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Movement {
    Left,
    Right,
    Up,
    Down,
    LineStart,
    LineEnd,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum SelectionGesture {
    Replace,
    Extend,
    Add,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum EditorAction {
    Move(Movement),
    Select(Movement),
    Backspace,
    Copy,
    Cut,
    Paste,
    AcceptCompletion,
    StartSearch,
    UpdateSearch(SharedString),
    SearchBackspace,
    NextSearchMatch,
    CloseSearch,
    ToggleFold(Range<usize>),
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum KeyboardDecision {
    Action(EditorAction),
    Insert(SharedString),
    Ignore,
}

/// Resolves a platform key into an editor intent without mutating state.
#[must_use]
pub fn keyboard_decision(
    key: &str,
    key_char: Option<&str>,
    modifiers: Modifiers,
    completion_visible: bool,
    search_active: bool,
) -> KeyboardDecision {
    let command = modifiers.secondary();
    let action = match key {
        "left" => Some(EditorAction::Move(Movement::Left)),
        "right" => Some(EditorAction::Move(Movement::Right)),
        "up" => Some(EditorAction::Move(Movement::Up)),
        "down" => Some(EditorAction::Move(Movement::Down)),
        "home" => Some(EditorAction::Move(Movement::LineStart)),
        "end" => Some(EditorAction::Move(Movement::LineEnd)),
        "backspace" if search_active => Some(EditorAction::SearchBackspace),
        "backspace" => Some(EditorAction::Backspace),
        "enter" if search_active => Some(EditorAction::NextSearchMatch),
        "enter" if completion_visible => Some(EditorAction::AcceptCompletion),
        "escape" if search_active => Some(EditorAction::CloseSearch),
        "f" if command => Some(EditorAction::StartSearch),
        "c" if command => Some(EditorAction::Copy),
        "x" if command => Some(EditorAction::Cut),
        "v" if command => Some(EditorAction::Paste),
        _ => None,
    };
    if let Some(action) = action {
        return KeyboardDecision::Action(if modifiers.shift {
            match action {
                EditorAction::Move(movement) => EditorAction::Select(movement),
                other => other,
            }
        } else {
            action
        });
    }
    if modifiers.control || modifiers.platform || modifiers.alt || modifiers.function {
        return KeyboardDecision::Ignore;
    }
    key_char.map_or(KeyboardDecision::Ignore, |text| {
        KeyboardDecision::Insert(text.into())
    })
}

/// Clipboard boundary for native, remote, or test hosts.
pub trait Clipboard: Send + Sync {
    fn read(&self) -> Option<String>;
    fn write(&self, text: &str);
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct EditorGeometry {
    pub origin_x: f32,
    pub origin_y: f32,
    pub gutter_width: f32,
    pub character_width: f32,
    pub line_height: f32,
}
impl Default for EditorGeometry {
    fn default() -> Self {
        Self {
            origin_x: 0.,
            origin_y: 0.,
            gutter_width: 64.,
            character_width: 8.,
            line_height: 20.,
        }
    }
}
impl EditorGeometry {
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
    #[must_use]
    pub fn hit_test(self, x: f32, y: f32, scroll_row: usize) -> Point {
        Point::new(
            scroll_row + ((y - self.origin_y).max(0.) / self.line_height).floor() as usize,
            ((x - self.origin_x - self.gutter_width).max(0.) / self.character_width).round()
                as usize,
        )
    }
    #[allow(clippy::cast_precision_loss)]
    #[must_use]
    pub fn anchor(self, point: Point, scroll_row: usize) -> (f32, f32) {
        (
            self.origin_x + self.gutter_width + point.column as f32 * self.character_width,
            self.origin_y + point.row.saturating_sub(scroll_row) as f32 * self.line_height,
        )
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct EditorChrome {
    pub title: Option<SharedString>,
    pub breadcrumb: Vec<SharedString>,
    pub language: Option<SharedString>,
    pub read_only: bool,
    pub show_gutter: bool,
    pub show_status_bar: bool,
}
impl Default for EditorChrome {
    fn default() -> Self {
        Self {
            title: None,
            breadcrumb: Vec::new(),
            language: None,
            read_only: false,
            show_gutter: true,
            show_status_bar: true,
        }
    }
}

/// Stateful editing handle shared by the GPUI element and its host application.
#[derive(Clone)]
pub struct EditorController {
    model: Arc<Mutex<EditorModel>>,
    clipboard: Option<Arc<dyn Clipboard>>,
}
impl EditorController {
    #[must_use]
    pub fn new(model: EditorModel) -> Self {
        Self {
            model: Arc::new(Mutex::new(model)),
            clipboard: None,
        }
    }
    #[must_use]
    pub fn clipboard(mut self, clipboard: Arc<dyn Clipboard>) -> Self {
        self.clipboard = Some(clipboard);
        self
    }
    #[must_use]
    pub fn model(&self) -> Arc<Mutex<EditorModel>> {
        self.model.clone()
    }
    /// Dispatches a semantic editor action.
    ///
    /// # Panics
    /// Panics if a previous host callback poisoned the shared editor lock.
    pub fn dispatch(&self, action: EditorAction, completion: Option<&Completion>) {
        let mut model = self.model.lock().expect("editor model lock poisoned");
        match action {
            EditorAction::Move(movement) => model.move_cursors(movement, false),
            EditorAction::Select(movement) => model.move_cursors(movement, true),
            EditorAction::Backspace if !model.text().is_empty() => model.backspace(),
            EditorAction::Copy => {
                if let Some(clipboard) = &self.clipboard {
                    clipboard.write(&model.selected_text());
                }
            }
            EditorAction::Cut => {
                if let Some(clipboard) = &self.clipboard {
                    clipboard.write(&model.selected_text());
                    model.insert("");
                }
            }
            EditorAction::Paste => {
                if let Some(text) = self
                    .clipboard
                    .as_ref()
                    .and_then(|clipboard| clipboard.read())
                {
                    model.insert(&text);
                }
            }
            EditorAction::AcceptCompletion => {
                if let Some(completion) = completion {
                    model.apply_completion(completion, None);
                }
            }
            EditorAction::StartSearch => {
                model.search_query = Some(SharedString::default());
                model.search_matches.clear();
            }
            EditorAction::UpdateSearch(query) => {
                model.search_query = Some(query.clone());
                model.search(&query);
            }
            EditorAction::SearchBackspace => {
                let mut query = model.search_query.clone().unwrap_or_default().to_string();
                query.pop();
                model.search_query = Some(query.clone().into());
                model.search(&query);
            }
            EditorAction::NextSearchMatch => {
                let cursor = model
                    .selections
                    .last()
                    .map_or(Point::default(), |selection| selection.head);
                let next = model
                    .search_matches
                    .iter()
                    .find(|range| range.start > cursor)
                    .or_else(|| model.search_matches.first())
                    .cloned();
                if let Some(range) = next {
                    model.set_selections(vec![Selection {
                        anchor: range.start,
                        head: range.end,
                    }]);
                }
            }
            EditorAction::CloseSearch => {
                model.search_query = None;
                model.search_matches.clear();
            }
            EditorAction::ToggleFold(rows) => model.toggle_fold(rows),
            EditorAction::Backspace => {}
        }
    }

    /// Applies a resolved keyboard decision with search and read-only routing.
    ///
    /// # Panics
    /// Panics if a previous host callback poisoned the shared editor lock.
    pub fn dispatch_keyboard(
        &self,
        decision: KeyboardDecision,
        completion: Option<&Completion>,
        read_only: bool,
    ) {
        let search_active = self
            .model
            .lock()
            .expect("editor model lock poisoned")
            .search_query
            .is_some();
        match decision {
            KeyboardDecision::Action(EditorAction::AcceptCompletion)
                if !read_only && !search_active =>
            {
                self.dispatch(EditorAction::AcceptCompletion, completion);
            }
            KeyboardDecision::Action(EditorAction::Backspace) if !read_only && !search_active => {
                self.dispatch(EditorAction::Backspace, None);
            }
            KeyboardDecision::Action(action @ (EditorAction::Cut | EditorAction::Paste))
                if !read_only && !search_active =>
            {
                self.dispatch(action, None);
            }
            KeyboardDecision::Action(
                EditorAction::AcceptCompletion
                | EditorAction::Backspace
                | EditorAction::Cut
                | EditorAction::Paste,
            ) => {}
            KeyboardDecision::Action(action) => self.dispatch(action, None),
            KeyboardDecision::Insert(text) if search_active => {
                let mut query = self
                    .model
                    .lock()
                    .expect("editor model lock poisoned")
                    .search_query
                    .clone()
                    .unwrap_or_default()
                    .to_string();
                query.push_str(&text);
                self.dispatch(EditorAction::UpdateSearch(query.into()), None);
            }
            KeyboardDecision::Insert(text) if !read_only => self
                .model
                .lock()
                .expect("editor model lock poisoned")
                .insert(&text),
            KeyboardDecision::Insert(_) | KeyboardDecision::Ignore => {}
        }
    }
}

type ChangeHandler = Arc<dyn Fn(&EditorSnapshot, &mut Window, &mut App)>;

/// Focusable, keyboard and pointer-operable GPUI editor component.
#[derive(IntoElement)]
pub struct OperableEditor {
    controller: EditorController,
    providers: EditorProviders,
    extensions: Vec<Arc<dyn EditorExtension>>,
    focus: FocusHandle,
    geometry: EditorGeometry,
    chrome: EditorChrome,
    theme: AuroraTheme,
    on_change: Option<ChangeHandler>,
}
impl OperableEditor {
    #[must_use]
    pub fn new(controller: EditorController, cx: &mut App) -> Self {
        Self {
            controller,
            providers: EditorProviders::default(),
            extensions: Vec::new(),
            focus: cx.focus_handle().tab_stop(true),
            geometry: EditorGeometry::default(),
            chrome: EditorChrome::default(),
            theme: AuroraTheme::default(),
            on_change: None,
        }
    }
    #[must_use]
    pub fn providers(mut self, providers: EditorProviders) -> Self {
        self.providers = providers;
        self
    }
    #[must_use]
    pub fn extension(mut self, extension: Arc<dyn EditorExtension>) -> Self {
        self.extensions.push(extension);
        self
    }
    #[must_use]
    pub const fn geometry(mut self, geometry: EditorGeometry) -> Self {
        self.geometry = geometry;
        self
    }
    #[must_use]
    pub fn chrome(mut self, chrome: EditorChrome) -> Self {
        self.chrome = chrome;
        self
    }
    #[must_use]
    pub const fn theme(mut self, theme: AuroraTheme) -> Self {
        self.theme = theme;
        self
    }
    #[must_use]
    pub fn on_change(
        mut self,
        handler: impl Fn(&EditorSnapshot, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_change = Some(Arc::new(handler));
        self
    }
    #[must_use]
    pub fn focus_handle(&self) -> FocusHandle {
        self.focus.clone()
    }
}

impl RenderOnce for OperableEditor {
    #[allow(clippy::too_many_lines)]
    fn render(self, _window: &mut Window, _cx: &mut App) -> impl IntoElement {
        let presentation = {
            let model = self
                .controller
                .model
                .lock()
                .expect("editor model lock poisoned");
            EditorPresentation::resolve(&model, &self.providers, &self.extensions)
        };
        let aria_value: SharedString = presentation.snapshot.text.to_string().into();
        let completion = presentation.completions.first().cloned();
        let keyboard_controller = self.controller.clone();
        let keyboard_change = self.on_change.clone();
        let pointer_controller = self.controller.clone();
        let pointer_change = self.on_change.clone();
        let scroll_controller = self.controller.clone();
        let scroll_change = self.on_change.clone();
        let focus = self.focus.clone();
        let geometry = self.geometry;
        let chrome = self.chrome.clone();
        let title = chrome.title.clone();
        let breadcrumb = chrome.breadcrumb.clone();
        let language = chrome.language.clone();
        let read_only = chrome.read_only;

        div()
            .id("aurora-operable-editor")
            .role(gpui::Role::TextInput)
            .aria_label(title.clone().unwrap_or_else(|| "Code Editor".into()))
            .aria_value(aria_value)
            .aria_description(if read_only {
                "Read-only editor"
            } else {
                "Editable code editor"
            })
            .track_focus(&self.focus)
            .flex()
            .flex_col()
            .border_1()
            .border_color(self.theme.colors.border)
            .when_some(title, |this, title| {
                this.child(
                    div()
                        .px(px(self.theme.space.sm))
                        .py(px(self.theme.space.xs))
                        .text_color(self.theme.colors.text)
                        .child(title),
                )
            })
            .when(!breadcrumb.is_empty(), |this| {
                this.child(
                    div()
                        .px(px(self.theme.space.sm))
                        .text_color(self.theme.colors.text_muted)
                        .child(
                            breadcrumb
                                .into_iter()
                                .map(|part| part.to_string())
                                .collect::<Vec<_>>()
                                .join(" / "),
                        ),
                )
            })
            .child(
                EditorSurface::new(presentation)
                    .theme(self.theme)
                    .geometry(geometry)
                    .show_line_numbers(chrome.show_gutter),
            )
            .when(chrome.show_status_bar, |this| {
                this.child(
                    div()
                        .flex()
                        .justify_between()
                        .px(px(self.theme.space.sm))
                        .py(px(self.theme.space.xs))
                        .bg(gpui::Hsla::from(self.theme.colors.surface))
                        .text_color(self.theme.colors.text_muted)
                        .child(language.unwrap_or_else(|| "Plain Text".into()))
                        .child(if chrome.read_only {
                            "Read Only"
                        } else {
                            "Editable"
                        }),
                )
            })
            .on_key_down(move |event: &KeyDownEvent, window, cx| {
                let search_active = keyboard_controller
                    .model
                    .lock()
                    .expect("editor model lock poisoned")
                    .search_query
                    .is_some();
                let decision = keyboard_decision(
                    &event.keystroke.key,
                    event.keystroke.key_char.as_deref(),
                    event.keystroke.modifiers,
                    completion.is_some(),
                    search_active,
                );
                keyboard_controller.dispatch_keyboard(decision, completion.as_ref(), read_only);
                if event.keystroke.modifiers.secondary()
                    && event.keystroke.modifiers.shift
                    && event.keystroke.key == "["
                {
                    let row = keyboard_controller
                        .model
                        .lock()
                        .expect("editor model lock poisoned")
                        .selections
                        .last()
                        .map_or(0, |selection| selection.head.row);
                    keyboard_controller
                        .dispatch(EditorAction::ToggleFold(row..row.saturating_add(2)), None);
                }
                if let Some(handler) = &keyboard_change {
                    let snapshot = keyboard_controller
                        .model
                        .lock()
                        .expect("editor model lock poisoned")
                        .snapshot();
                    handler(&snapshot, window, cx);
                }
            })
            .on_mouse_down(
                MouseButton::Left,
                move |event: &MouseDownEvent, window, cx| {
                    focus.focus(window, cx);
                    let model_handle = pointer_controller.model();
                    let mut model = model_handle.lock().expect("editor model lock poisoned");
                    let point = geometry.hit_test(
                        event.position.x / px(1.),
                        event.position.y / px(1.),
                        model.visible_rows().start,
                    );
                    let gesture = if event.modifiers.shift {
                        SelectionGesture::Extend
                    } else if event.modifiers.secondary() {
                        SelectionGesture::Add
                    } else {
                        SelectionGesture::Replace
                    };
                    model.select_at(point, gesture);
                    let snapshot = model.snapshot();
                    drop(model);
                    if let Some(handler) = &pointer_change {
                        handler(&snapshot, window, cx);
                    }
                },
            )
            .on_scroll_wheel(move |event: &ScrollWheelEvent, window, cx| {
                let delta =
                    event.delta.pixel_delta(px(geometry.line_height)).y / px(geometry.line_height);
                let mut model = scroll_controller
                    .model
                    .lock()
                    .expect("editor model lock poisoned");
                let rows = if delta > 0. {
                    1
                } else if delta < 0. {
                    -1
                } else {
                    0
                };
                model.scroll_by(rows);
                let snapshot = model.snapshot();
                drop(model);
                if let Some(handler) = &scroll_change {
                    handler(&snapshot, window, cx);
                }
            })
    }
}

pub struct EditorModel<B: TextBuffer = StringBuffer> {
    buffer: B,
    selections: Vec<Selection>,
    scroll_row: usize,
    viewport_rows: usize,
    folded_rows: Vec<Range<usize>>,
    search_matches: Vec<Range<Point>>,
    preferred_column: Option<usize>,
    search_query: Option<SharedString>,
}

impl<B: TextBuffer> EditorModel<B> {
    #[must_use]
    pub fn new(buffer: B) -> Self {
        Self {
            buffer,
            selections: vec![Selection::cursor(Point::default())],
            scroll_row: 0,
            viewport_rows: 24,
            folded_rows: Vec::new(),
            search_matches: Vec::new(),
            preferred_column: None,
            search_query: None,
        }
    }
    #[must_use]
    pub fn text(&self) -> &str {
        self.buffer.text()
    }
    #[must_use]
    pub fn selections(&self) -> &[Selection] {
        &self.selections
    }
    pub fn set_selections(&mut self, mut selections: Vec<Selection>) {
        if selections.is_empty() {
            selections.push(Selection::cursor(Point::default()));
        }
        for selection in &mut selections {
            selection.anchor = self.clip_point(selection.anchor);
            selection.head = self.clip_point(selection.head);
        }
        self.selections = self.normalized_selections(selections);
    }
    pub fn set_viewport(&mut self, first_row: usize, row_count: usize) {
        self.scroll_row = first_row.min(self.line_count().saturating_sub(1));
        self.viewport_rows = row_count.max(1);
    }
    #[must_use]
    pub fn visible_rows(&self) -> Range<usize> {
        self.scroll_row..(self.scroll_row + self.viewport_rows).min(self.line_count())
    }
    pub fn scroll_by(&mut self, rows: isize) {
        self.scroll_row = self
            .scroll_row
            .saturating_add_signed(rows)
            .min(self.line_count().saturating_sub(1));
    }
    pub fn toggle_fold(&mut self, rows: Range<usize>) {
        if let Some(index) = self.folded_rows.iter().position(|fold| *fold == rows) {
            self.folded_rows.remove(index);
        } else if rows.start < rows.end && rows.end <= self.line_count() {
            self.folded_rows.push(rows);
            self.folded_rows.sort_by_key(|fold| fold.start);
        }
    }
    #[must_use]
    pub fn is_row_hidden(&self, row: usize) -> bool {
        self.folded_rows
            .iter()
            .any(|fold| row > fold.start && row < fold.end)
    }
    pub fn insert(&mut self, text: &str) {
        let normalized = self.normalized_selections(self.selections.clone());
        let mut ranges: Vec<_> = normalized
            .iter()
            .map(|selection| {
                let range = selection.ordered();
                (
                    self.offset_for_point(range.start),
                    self.offset_for_point(range.end),
                )
            })
            .collect();
        ranges.sort_unstable();
        let mut offsets = Vec::with_capacity(ranges.len());
        let mut delta = 0_isize;
        for (start, end) in ranges {
            let adjusted_start = start.saturating_add_signed(delta);
            let adjusted_end = end.saturating_add_signed(delta);
            self.buffer.replace(adjusted_start..adjusted_end, text);
            offsets.push(adjusted_start + text.len());
            delta += text.len().cast_signed() - (end - start).cast_signed();
        }
        offsets.sort_unstable();
        self.selections = offsets
            .into_iter()
            .map(|offset| Selection::cursor(self.point_for_offset(offset)))
            .collect();
        self.search_matches.clear();
        self.preferred_column = None;
    }
    pub fn backspace(&mut self) {
        let mut selections = self.selections.clone();
        for selection in &mut selections {
            if selection.is_cursor() {
                let offset = self.offset_for_point(selection.head);
                if let Some((previous, _)) = self.text()[..offset].char_indices().next_back() {
                    selection.anchor = self.point_for_offset(previous);
                }
            }
        }
        self.set_selections(selections);
        self.insert("");
    }
    pub fn search(&mut self, query: &str) -> &[Range<Point>] {
        self.search_matches.clear();
        if query.is_empty() {
            return &self.search_matches;
        }
        let mut base = 0;
        while let Some(index) = self.text()[base..].find(query) {
            let start = base + index;
            let end = start + query.len();
            self.search_matches
                .push(self.point_for_offset(start)..self.point_for_offset(end));
            base = end;
        }
        &self.search_matches
    }

    /// Applies an accepted completion to its requested range or the primary selection.
    pub fn apply_completion(&mut self, completion: &Completion, range: Option<Range<Point>>) {
        if let Some(range) = range {
            self.set_selections(vec![Selection {
                anchor: range.start,
                head: range.end,
            }]);
        }
        self.insert(&completion.replacement);
    }

    /// Moves every cursor while optionally extending its selection.
    pub fn move_cursors(&mut self, movement: Movement, extend: bool) {
        let mut selections = self.selections.clone();
        for selection in &mut selections {
            let head = self.moved_point(selection.head, movement);
            if !extend {
                selection.anchor = head;
            }
            selection.head = head;
        }
        self.set_selections(selections);
    }

    /// Updates the primary selection from a pointer gesture resolved by [`EditorGeometry`].
    pub fn select_at(&mut self, point: Point, gesture: SelectionGesture) {
        let point = self.clip_point(point);
        match gesture {
            SelectionGesture::Replace => self.set_selections(vec![Selection::cursor(point)]),
            SelectionGesture::Extend => {
                let anchor = self
                    .selections
                    .last()
                    .map_or(point, |selection| selection.anchor);
                self.set_selections(vec![Selection {
                    anchor,
                    head: point,
                }]);
            }
            SelectionGesture::Add => {
                let mut selections = self.selections.clone();
                selections.push(Selection::cursor(point));
                self.set_selections(selections);
            }
        }
    }

    #[must_use]
    pub fn selected_text(&self) -> String {
        self.selections
            .iter()
            .filter(|selection| !selection.is_cursor())
            .map(|selection| {
                let range = selection.ordered();
                &self.text()[self.offset_for_point(range.start)..self.offset_for_point(range.end)]
            })
            .collect::<Vec<_>>()
            .join("\n")
    }

    fn moved_point(&mut self, point: Point, movement: Movement) -> Point {
        match movement {
            Movement::Left => {
                let offset = self.offset_for_point(point);
                let previous = self.text()[..offset]
                    .char_indices()
                    .next_back()
                    .map_or(0, |(offset, _)| offset);
                self.point_for_offset(previous)
            }
            Movement::Right => {
                let offset = self.offset_for_point(point);
                let step = self.text()[offset..]
                    .chars()
                    .next()
                    .map_or(0, char::len_utf8);
                self.point_for_offset(offset + step)
            }
            Movement::Up | Movement::Down => {
                let column = *self.preferred_column.get_or_insert(point.column);
                let row = if movement == Movement::Up {
                    point.row.saturating_sub(1)
                } else {
                    (point.row + 1).min(self.line_count().saturating_sub(1))
                };
                Point::new(row, column.min(self.line(row).chars().count()))
            }
            Movement::LineStart => Point::new(point.row, 0),
            Movement::LineEnd => Point::new(point.row, self.line(point.row).chars().count()),
        }
    }

    fn normalized_selections(&self, selections: Vec<Selection>) -> Vec<Selection> {
        let mut ranges: Vec<(usize, usize)> = selections
            .into_iter()
            .map(|selection| {
                let range = selection.ordered();
                (
                    self.offset_for_point(range.start),
                    self.offset_for_point(range.end),
                )
            })
            .collect();
        ranges.sort_unstable();
        let mut merged: Vec<(usize, usize)> = Vec::new();
        for range in ranges {
            if let Some(previous) = merged.last_mut() {
                let duplicate = range == *previous;
                let overlaps = range.0 < previous.1;
                if duplicate || overlaps {
                    previous.1 = previous.1.max(range.1);
                    continue;
                }
            }
            merged.push(range);
        }
        merged
            .into_iter()
            .map(|(start, end)| Selection {
                anchor: self.point_for_offset(start),
                head: self.point_for_offset(end),
            })
            .collect()
    }
    #[must_use]
    pub fn search_matches(&self) -> &[Range<Point>] {
        &self.search_matches
    }
    #[must_use]
    pub fn snapshot(&self) -> EditorSnapshot {
        EditorSnapshot {
            text: Arc::from(self.text()),
            selections: Arc::from(self.selections.clone()),
            visible_rows: self.visible_rows(),
            folded_rows: Arc::from(self.folded_rows.clone()),
            search_query: self.search_query.clone(),
        }
    }
    #[must_use]
    pub fn line_count(&self) -> usize {
        self.text().split('\n').count().max(1)
    }
    fn clip_point(&self, point: Point) -> Point {
        let row = point.row.min(self.line_count().saturating_sub(1));
        Point::new(row, point.column.min(self.line(row).chars().count()))
    }
    fn line(&self, row: usize) -> &str {
        self.text().split('\n').nth(row).unwrap_or("")
    }
    fn offset_for_point(&self, point: Point) -> usize {
        let point = self.clip_point(point);
        let row_offset: usize = self
            .text()
            .split('\n')
            .take(point.row)
            .map(|line| line.len() + 1)
            .sum();
        let column = self
            .line(point.row)
            .char_indices()
            .nth(point.column)
            .map_or(self.line(point.row).len(), |(offset, _)| offset);
        row_offset + column
    }
    fn point_for_offset(&self, offset: usize) -> Point {
        let prefix = &self.text()[..offset.min(self.text().len())];
        Point::new(
            prefix.bytes().filter(|byte| *byte == b'\n').count(),
            prefix.rsplit('\n').next().unwrap_or("").chars().count(),
        )
    }
}

pub struct EditorPresentation {
    pub snapshot: EditorSnapshot,
    pub diagnostics: Vec<Diagnostic>,
    pub inlays: Vec<Inlay>,
    pub completions: Vec<Completion>,
    pub hover: Option<Hover>,
    pub decorations: Vec<Decoration>,
    pub search_matches: Vec<Range<Point>>,
}
impl EditorPresentation {
    #[must_use]
    pub fn resolve<B: TextBuffer>(
        model: &EditorModel<B>,
        providers: &EditorProviders,
        extensions: &[Arc<dyn EditorExtension>],
    ) -> Self {
        let snapshot = model.snapshot();
        let cursor = snapshot
            .selections
            .last()
            .map_or(Point::default(), |selection| selection.head);
        let diagnostics = providers
            .diagnostics
            .as_ref()
            .map_or_else(Vec::new, |provider| provider.diagnostics(&snapshot.text));
        let inlays = providers.inlays.as_ref().map_or_else(Vec::new, |provider| {
            provider.inlays(&snapshot.text, snapshot.visible_rows.clone())
        });
        let completions = providers
            .completion
            .as_ref()
            .map_or_else(Vec::new, |provider| {
                provider.completions(&snapshot.text, cursor)
            });
        let hover = providers
            .hover
            .as_ref()
            .and_then(|provider| provider.hover(&snapshot.text, cursor));
        let decorations = extensions
            .iter()
            .flat_map(|extension| extension.decorate(&snapshot))
            .collect();
        Self {
            snapshot,
            diagnostics,
            inlays,
            completions,
            hover,
            decorations,
            search_matches: model.search_matches.clone(),
        }
    }
}

#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct LinePaintPlan {
    pub cursors: Vec<usize>,
    pub selections: Vec<Range<usize>>,
}

/// Resolves every cursor and selection span affecting a visible line.
#[must_use]
pub fn line_paint_plan(row: usize, line_length: usize, selections: &[Selection]) -> LinePaintPlan {
    let mut plan = LinePaintPlan::default();
    for selection in selections {
        let range = selection.ordered();
        if selection.is_cursor() && selection.head.row == row {
            plan.cursors.push(selection.head.column.min(line_length));
        } else if row >= range.start.row && row <= range.end.row {
            let start = if row == range.start.row {
                range.start.column
            } else {
                0
            }
            .min(line_length);
            let end = if row == range.end.row {
                range.end.column
            } else {
                line_length
            }
            .min(line_length)
            .max(start);
            if start < end {
                plan.selections.push(start..end);
            }
        }
    }
    plan
}

#[derive(IntoElement)]
pub struct EditorSurface {
    presentation: EditorPresentation,
    theme: AuroraTheme,
    show_line_numbers: bool,
    geometry: EditorGeometry,
}
impl EditorSurface {
    #[must_use]
    pub fn new(presentation: EditorPresentation) -> Self {
        Self {
            presentation,
            theme: AuroraTheme::default(),
            show_line_numbers: true,
            geometry: EditorGeometry::default(),
        }
    }
    #[must_use]
    pub const fn theme(mut self, theme: AuroraTheme) -> Self {
        self.theme = theme;
        self
    }
    #[must_use]
    pub const fn show_line_numbers(mut self, show: bool) -> Self {
        self.show_line_numbers = show;
        self
    }
    #[must_use]
    pub const fn geometry(mut self, geometry: EditorGeometry) -> Self {
        self.geometry = geometry;
        self
    }
}
impl RenderOnce for EditorSurface {
    // Keeping the complete layer stack together makes its paint order explicit.
    #[allow(clippy::too_many_lines, clippy::cast_precision_loss)]
    fn render(self, _window: &mut gpui::Window, _cx: &mut gpui::App) -> impl IntoElement {
        let colors = self.theme.colors;
        let search_query = self.presentation.snapshot.search_query.clone();
        let lines: Vec<_> = self.presentation.snapshot.text.split('\n').collect();
        let primary_cursor = self
            .presentation
            .snapshot
            .selections
            .last()
            .map(|selection| selection.head);
        let hover_anchor = primary_cursor.map_or((self.geometry.gutter_width, 0.), |point| {
            self.geometry
                .anchor(point, self.presentation.snapshot.visible_rows.start)
        });
        let rows =
            self.presentation
                .snapshot
                .visible_rows
                .clone()
                .filter(|row| {
                    !self
                        .presentation
                        .snapshot
                        .folded_rows
                        .iter()
                        .any(|fold| *row > fold.start && *row < fold.end)
                })
                .map(|row| {
                    let searched = self
                        .presentation
                        .search_matches
                        .iter()
                        .any(|range| row >= range.start.row && row <= range.end.row);
                    let diagnostic = self
                        .presentation
                        .diagnostics
                        .iter()
                        .find(|item| row >= item.range.start.row && row <= item.range.end.row);
                    let is_fold = self
                        .presentation
                        .snapshot
                        .folded_rows
                        .iter()
                        .any(|fold| fold.start == row);
                    let inlays: SharedString = self
                        .presentation
                        .inlays
                        .iter()
                        .filter(|inlay| inlay.position.row == row)
                        .fold(String::new(), |mut output, inlay| {
                            let _ = write!(output, "  {}", inlay.label);
                            output
                        })
                        .into();
                    let decorations: SharedString = self
                        .presentation
                        .decorations
                        .iter()
                        .filter(|decoration| {
                            row >= decoration.range.start.row && row <= decoration.range.end.row
                        })
                        .fold(String::new(), |mut output, decoration| {
                            let _ = write!(output, "  {}", decoration.label);
                            output
                        })
                        .into();
                    let marker = diagnostic.map_or(" ", |item| match item.severity {
                        DiagnosticSeverity::Error => "●",
                        DiagnosticSeverity::Warning => "▲",
                        DiagnosticSeverity::Information => "i",
                        DiagnosticSeverity::Hint => "·",
                    });
                    let background: gpui::Hsla = if searched {
                        colors.warning.with_alpha(24)
                    } else {
                        colors.background.with_alpha(0)
                    }
                    .into();
                    let line = lines.get(row).copied().unwrap_or("");
                    let line_length = line.chars().count();
                    let paint =
                        line_paint_plan(row, line_length, &self.presentation.snapshot.selections);
                    let text_layer = div()
                        .relative()
                        .flex()
                        .flex_1()
                        .text_color(colors.text)
                        .child(line.to_owned())
                        .children(paint.selections.into_iter().map(|range| {
                            div()
                                .absolute()
                                .left(px(range.start as f32 * self.geometry.character_width))
                                .top_0()
                                .w(px((range.end - range.start) as f32
                                    * self.geometry.character_width))
                                .h(px(self.geometry.line_height))
                                .bg(gpui::Hsla::from(colors.primary.with_alpha(48)))
                        }))
                        .children(paint.cursors.into_iter().map(|column| {
                            div()
                                .absolute()
                                .left(px(column as f32 * self.geometry.character_width))
                                .top_0()
                                .w(px(1.))
                                .h(px(self.geometry.line_height))
                                .bg(gpui::Hsla::from(colors.primary))
                        }));
                    div()
                        .flex()
                        .w_full()
                        .bg(background)
                        .child(
                            div()
                                .flex()
                                .w(px(self.geometry.gutter_width))
                                .justify_end()
                                .gap(px(8.))
                                .pr(px(8.))
                                .text_color(diagnostic.map_or(colors.text_muted, |_| colors.danger))
                                .when(self.show_line_numbers, |this| {
                                    this.child(format!("{}", row + 1))
                                })
                                .child(marker),
                        )
                        .child(
                            text_layer.child(if is_fold { "  …" } else { "" }).child(
                                div()
                                    .text_color(colors.text_muted)
                                    .child(inlays)
                                    .child(decorations),
                            ),
                        )
                });
        let intelligence = div()
            .absolute()
            .left(px(hover_anchor.0))
            .top(px(hover_anchor.1 + 20.))
            .flex()
            .flex_col()
            .gap(px(self.theme.space.xs))
            .when_some(self.presentation.hover, |this, hover| {
                this.child(
                    div()
                        .p(px(self.theme.space.sm))
                        .rounded(px(self.theme.radii.md))
                        .border_1()
                        .border_color(colors.border)
                        .bg(gpui::Hsla::from(colors.surface))
                        .text_color(colors.text)
                        .child(hover.contents),
                )
            })
            .when(!self.presentation.completions.is_empty(), |this| {
                this.child(
                    div()
                        .flex()
                        .flex_col()
                        .p(px(self.theme.space.xs))
                        .rounded(px(self.theme.radii.md))
                        .border_1()
                        .border_color(colors.border_focused)
                        .bg(gpui::Hsla::from(colors.surface))
                        .children(self.presentation.completions.into_iter().map(|completion| {
                            div()
                                .px(px(self.theme.space.sm))
                                .py(px(self.theme.space.xs))
                                .text_color(colors.text)
                                .child(completion.label)
                        })),
                )
            });
        div()
            .relative()
            .flex()
            .flex_col()
            .overflow_hidden()
            .rounded(px(self.theme.radii.md))
            .border_1()
            .border_color(colors.border)
            .bg(gpui::Hsla::from(colors.background))
            .font_family("monospace")
            .text_size(rems(0.875))
            .when_some(search_query, |this, query| {
                this.child(
                    div()
                        .px(px(self.theme.space.sm))
                        .py(px(self.theme.space.xs))
                        .border_b_1()
                        .border_color(colors.border)
                        .text_color(colors.text)
                        .child(format!("Search: {query}")),
                )
            })
            .child(
                div()
                    .flex()
                    .flex_col()
                    .py(px(self.theme.space.xs))
                    .children(rows),
            )
            .child(intelligence)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[derive(Default)]
    struct MemoryClipboard(Mutex<Option<String>>);
    impl Clipboard for MemoryClipboard {
        fn read(&self) -> Option<String> {
            self.0.lock().expect("clipboard lock poisoned").clone()
        }
        fn write(&self, text: &str) {
            *self.0.lock().expect("clipboard lock poisoned") = Some(text.to_owned());
        }
    }
    #[test]
    fn edits_unicode_selection_and_tracks_cursor() {
        let mut model = EditorModel::new(StringBuffer::new("hello 🌎\nworld"));
        model.set_selections(vec![Selection {
            anchor: Point::new(0, 6),
            head: Point::new(0, 7),
        }]);
        model.insert("Aurora");
        assert_eq!(model.text(), "hello Aurora\nworld");
        assert_eq!(model.selections(), &[Selection::cursor(Point::new(0, 12))]);
        model.backspace();
        assert_eq!(model.text(), "hello Auror\nworld");
    }
    #[test]
    fn supports_multiple_cursors_without_offset_drift() {
        let mut model = EditorModel::new(StringBuffer::new("ab\ncd"));
        model.set_selections(vec![
            Selection::cursor(Point::new(0, 1)),
            Selection::cursor(Point::new(1, 1)),
        ]);
        model.insert("!");
        assert_eq!(model.text(), "a!b\nc!d");
        assert_eq!(
            model.selections(),
            &[
                Selection::cursor(Point::new(0, 2)),
                Selection::cursor(Point::new(1, 2))
            ]
        );
    }
    #[test]
    fn navigation_respects_unicode_character_boundaries() {
        let mut model = EditorModel::new(StringBuffer::new("a🌎b"));
        model.set_selections(vec![Selection::cursor(Point::new(0, 1))]);
        model.move_cursors(Movement::Right, false);
        assert_eq!(model.selections(), &[Selection::cursor(Point::new(0, 2))]);
        model.move_cursors(Movement::Left, false);
        assert_eq!(model.selections(), &[Selection::cursor(Point::new(0, 1))]);
    }
    #[test]
    fn normalizes_duplicate_forward_and_reversed_overlaps_before_editing() {
        let mut model = EditorModel::new(StringBuffer::new("abcdef"));
        model.set_selections(vec![
            Selection {
                anchor: Point::new(0, 1),
                head: Point::new(0, 4),
            },
            Selection {
                anchor: Point::new(0, 5),
                head: Point::new(0, 3),
            },
            Selection {
                anchor: Point::new(0, 1),
                head: Point::new(0, 4),
            },
        ]);
        assert_eq!(
            model.selections(),
            &[Selection {
                anchor: Point::new(0, 1),
                head: Point::new(0, 5)
            }]
        );
        model.insert("X");
        assert_eq!(model.text(), "aXf");
    }
    #[test]
    fn controller_applies_completion_navigation_and_clipboard_actions() {
        let clipboard = Arc::new(MemoryClipboard::default());
        let mut model = EditorModel::new(StringBuffer::new("hello"));
        model.set_selections(vec![Selection {
            anchor: Point::new(0, 0),
            head: Point::new(0, 5),
        }]);
        let controller = EditorController::new(model).clipboard(clipboard.clone());
        controller.dispatch(EditorAction::Copy, None);
        assert_eq!(clipboard.read().as_deref(), Some("hello"));
        controller.dispatch(
            EditorAction::AcceptCompletion,
            Some(&Completion {
                label: "world".into(),
                detail: None,
                replacement: "world".into(),
            }),
        );
        controller.dispatch(EditorAction::Move(Movement::LineStart), None);
        controller.dispatch(EditorAction::Paste, None);
        assert_eq!(
            controller
                .model()
                .lock()
                .expect("model lock poisoned")
                .text(),
            "helloworld"
        );
    }
    #[test]
    fn geometry_maps_pointer_and_hover_anchor_at_character_columns() {
        let geometry = EditorGeometry {
            origin_x: 10.,
            origin_y: 20.,
            gutter_width: 96.,
            ..EditorGeometry::default()
        };
        assert_eq!(geometry.hit_test(10. + 96. + 24., 60., 5), Point::new(7, 3));
        assert_eq!(geometry.anchor(Point::new(7, 3), 5), (130., 60.));
    }
    #[test]
    fn command_control_alt_and_function_modified_text_never_insert() {
        for modifiers in [
            Modifiers {
                platform: true,
                shift: true,
                ..Modifiers::default()
            },
            Modifiers {
                control: true,
                shift: true,
                ..Modifiers::default()
            },
            Modifiers {
                alt: true,
                shift: true,
                ..Modifiers::default()
            },
            Modifiers {
                function: true,
                shift: true,
                ..Modifiers::default()
            },
        ] {
            assert_eq!(
                keyboard_decision("k", Some("K"), modifiers, false, false),
                KeyboardDecision::Ignore
            );
        }
        assert_eq!(
            keyboard_decision(
                "k",
                Some("K"),
                Modifiers {
                    shift: true,
                    ..Modifiers::default()
                },
                false,
                false
            ),
            KeyboardDecision::Insert("K".into())
        );
    }
    #[test]
    fn paint_plan_contains_every_cursor_and_exact_selection_span() {
        let selections = [
            Selection::cursor(Point::new(0, 1)),
            Selection::cursor(Point::new(0, 4)),
            Selection {
                anchor: Point::new(0, 2),
                head: Point::new(0, 3),
            },
        ];
        let plan = line_paint_plan(0, 6, &selections);
        assert_eq!(plan.cursors, vec![1, 4]);
        assert_eq!(plan.selections.len(), 1);
        assert_eq!(plan.selections[0], 2..3);
    }
    #[test]
    fn search_and_fold_actions_are_operable_through_controller() {
        let controller =
            EditorController::new(EditorModel::new(StringBuffer::new("alpha\nbeta\nalpha")));
        controller.dispatch(EditorAction::StartSearch, None);
        controller.dispatch(EditorAction::UpdateSearch("alpha".into()), None);
        controller.dispatch(EditorAction::ToggleFold(0..2), None);
        let model = controller.model();
        let model = model.lock().expect("model lock poisoned");
        assert_eq!(model.search_matches().len(), 2);
        assert_eq!(model.snapshot().search_query.as_deref(), Some("alpha"));
        assert!(model.is_row_hidden(1));
    }
    #[test]
    fn search_keyboard_routing_edits_query_in_writable_and_read_only_documents() {
        for read_only in [false, true] {
            let controller =
                EditorController::new(EditorModel::new(StringBuffer::new("alpha beta alpha")));
            controller.dispatch(EditorAction::StartSearch, None);
            controller.dispatch_keyboard(
                keyboard_decision("a", Some("a"), Modifiers::default(), true, true),
                None,
                read_only,
            );
            controller.dispatch_keyboard(
                keyboard_decision("l", Some("l"), Modifiers::default(), true, true),
                None,
                read_only,
            );
            controller.dispatch_keyboard(
                keyboard_decision("backspace", None, Modifiers::default(), true, true),
                None,
                read_only,
            );
            {
                let model = controller.model();
                let model = model.lock().expect("model lock poisoned");
                assert_eq!(model.text(), "alpha beta alpha");
                assert_eq!(model.snapshot().search_query.as_deref(), Some("a"));
            }
            controller.dispatch_keyboard(
                keyboard_decision("enter", None, Modifiers::default(), true, true),
                None,
                read_only,
            );
            assert!(
                !controller
                    .model()
                    .lock()
                    .expect("model lock poisoned")
                    .selections()[0]
                    .is_cursor()
            );
            controller.dispatch_keyboard(
                keyboard_decision("escape", None, Modifiers::default(), true, true),
                None,
                read_only,
            );
            assert!(
                controller
                    .model()
                    .lock()
                    .expect("model lock poisoned")
                    .snapshot()
                    .search_query
                    .is_none()
            );
        }
    }
    #[test]
    fn viewport_folds_and_search_are_modelled() {
        let mut model = EditorModel::new(StringBuffer::new("alpha\nbeta\nalpha\ngamma"));
        model.set_viewport(1, 2);
        assert_eq!(model.visible_rows(), 1..3);
        model.scroll_by(1);
        assert_eq!(model.visible_rows(), 2..4);
        model.toggle_fold(0..3);
        assert!(model.is_row_hidden(1));
        assert_eq!(model.search("alpha").len(), 2);
    }
    struct Service;
    impl CompletionProvider for Service {
        fn completions(&self, _: &str, _: Point) -> Vec<Completion> {
            vec![Completion {
                label: "println!".into(),
                detail: Some("macro".into()),
                replacement: "println!()".into(),
            }]
        }
    }
    impl HoverProvider for Service {
        fn hover(&self, _: &str, _: Point) -> Option<Hover> {
            Some(Hover {
                range: None,
                contents: "Documentation".into(),
            })
        }
    }
    impl DiagnosticProvider for Service {
        fn diagnostics(&self, _: &str) -> Vec<Diagnostic> {
            vec![Diagnostic {
                range: Point::new(0, 0)..Point::new(0, 3),
                severity: DiagnosticSeverity::Warning,
                message: "Example".into(),
            }]
        }
    }
    impl InlayProvider for Service {
        fn inlays(&self, _: &str, _: Range<usize>) -> Vec<Inlay> {
            vec![Inlay {
                position: Point::new(0, 3),
                label: ": &str".into(),
            }]
        }
    }
    impl EditorExtension for Service {
        fn decorate(&self, _: &EditorSnapshot) -> Vec<Decoration> {
            vec![Decoration {
                range: Point::new(0, 0)..Point::new(0, 3),
                label: "extension".into(),
            }]
        }
    }
    #[test]
    fn presentation_resolves_every_provider_seam() {
        let service = Arc::new(Service);
        let providers = EditorProviders {
            completion: Some(service.clone()),
            hover: Some(service.clone()),
            diagnostics: Some(service.clone()),
            inlays: Some(service),
        };
        let model = EditorModel::new(StringBuffer::new("let name"));
        let extensions: Vec<Arc<dyn EditorExtension>> = vec![Arc::new(Service)];
        let presentation = EditorPresentation::resolve(&model, &providers, &extensions);
        assert_eq!(presentation.completions.len(), 1);
        assert!(presentation.hover.is_some());
        assert_eq!(presentation.diagnostics.len(), 1);
        assert_eq!(presentation.inlays.len(), 1);
        assert_eq!(presentation.decorations.len(), 1);
    }
}
