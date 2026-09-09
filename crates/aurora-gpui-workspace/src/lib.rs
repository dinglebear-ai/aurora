//! Application-neutral workspace shell components for Aurora GPUI.
//!
//! The models in this crate describe intent and persisted layout without owning
//! projects, files, commands, or application state. Rendering consumes Aurora's
//! semantic tokens and emits action payloads for a host application to handle.

#![allow(clippy::return_self_not_must_use)]
#![allow(clippy::missing_errors_doc)]

use std::{
    collections::{BTreeMap, BTreeSet},
    rc::Rc,
};

use aurora_gpui_core::AuroraTheme;
use gpui::{
    AccessibleAction, AnyElement, App, ElementId, IntoElement, RenderOnce, SharedString, Window,
    div, prelude::*, px,
};

type ActionHandler = Rc<dyn Fn(WorkspaceAction, &mut Window, &mut App)>;

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub enum DockPosition {
    Left,
    Right,
    Bottom,
}

#[derive(Clone, Debug, PartialEq)]
pub struct PanelState {
    pub id: SharedString,
    pub dock: DockPosition,
    pub size: f32,
    pub min_size: f32,
    pub max_size: f32,
    pub collapsed: bool,
}

impl PanelState {
    pub fn new(id: impl Into<SharedString>, dock: DockPosition, size: f32) -> Self {
        Self {
            id: id.into(),
            dock,
            size,
            min_size: 120.0,
            max_size: 720.0,
            collapsed: false,
        }
    }

    pub fn resized(&self, delta: f32) -> Self {
        let mut next = self.clone();
        next.size = (self.size + delta).clamp(self.min_size, self.max_size);
        next
    }

    pub fn validate(&self) -> Result<(), LayoutValidationError> {
        if !self.size.is_finite() || !self.min_size.is_finite() || !self.max_size.is_finite() {
            return Err(LayoutValidationError::NonFinitePanelSize(self.id.clone()));
        }
        if self.min_size < 0.0
            || self.max_size < self.min_size
            || self.size < self.min_size
            || self.size > self.max_size
        {
            return Err(LayoutValidationError::InvalidPanelBounds(self.id.clone()));
        }
        Ok(())
    }

    pub fn toggled(&self) -> Self {
        let mut next = self.clone();
        next.collapsed = !next.collapsed;
        next
    }
}

#[derive(Clone, Debug, PartialEq)]
pub enum LayoutValidationError {
    UnsupportedVersion(u16),
    NonFinitePanelSize(SharedString),
    InvalidPanelBounds(SharedString),
    PanelKeyMismatch {
        key: SharedString,
        id: SharedString,
    },
    DuplicatePaneId(SharedString),
    DuplicateItemId(SharedString),
    ActiveItemMissing {
        pane: SharedString,
        item: SharedString,
    },
    FocusedPaneMissing(SharedString),
    NonFiniteSplitRatio,
    InvalidSplitRatio,
}

#[derive(Debug)]
pub enum WorkspaceControllerError<E> {
    Store(E),
    InvalidLayout(LayoutValidationError),
}

pub struct WorkspaceController<S: LayoutStore> {
    workspace_id: SharedString,
    store: S,
    layout: WorkspaceLayout,
}
impl<S: LayoutStore> WorkspaceController<S> {
    pub fn restore(
        workspace_id: impl Into<SharedString>,
        store: S,
        fallback: WorkspaceLayout,
    ) -> Result<Self, WorkspaceControllerError<S::Error>> {
        fallback
            .validate()
            .map_err(WorkspaceControllerError::InvalidLayout)?;
        let workspace_id = workspace_id.into();
        let layout = store
            .load(&workspace_id)
            .map_err(WorkspaceControllerError::Store)?
            .unwrap_or(fallback);
        layout
            .validate()
            .map_err(WorkspaceControllerError::InvalidLayout)?;
        Ok(Self {
            workspace_id,
            store,
            layout,
        })
    }
    pub fn layout(&self) -> &WorkspaceLayout {
        &self.layout
    }
    pub fn dispatch(
        &mut self,
        action: &WorkspaceAction,
    ) -> Result<(), WorkspaceControllerError<S::Error>> {
        let next = self.layout.reduced(action);
        if next == self.layout {
            return Ok(());
        }
        next.validate()
            .map_err(WorkspaceControllerError::InvalidLayout)?;
        self.store
            .save(&self.workspace_id, &next)
            .map_err(WorkspaceControllerError::Store)?;
        self.layout = next;
        Ok(())
    }
    pub fn into_store(self) -> S {
        self.store
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum SplitAxis {
    Horizontal,
    Vertical,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ItemTab {
    pub id: SharedString,
    pub label: SharedString,
    pub dirty: bool,
    pub pinned: bool,
}

impl ItemTab {
    pub fn new(id: impl Into<SharedString>, label: impl Into<SharedString>) -> Self {
        Self {
            id: id.into(),
            label: label.into(),
            dirty: false,
            pinned: false,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct PaneState {
    pub id: SharedString,
    pub tabs: Vec<ItemTab>,
    pub active: Option<SharedString>,
}

impl PaneState {
    pub fn new(id: impl Into<SharedString>) -> Self {
        Self {
            id: id.into(),
            tabs: Vec::new(),
            active: None,
        }
    }

    pub fn select(&self, id: &str) -> Option<Self> {
        self.tabs.iter().any(|tab| tab.id.as_ref() == id).then(|| {
            let mut next = self.clone();
            next.active = Some(id.to_owned().into());
            next
        })
    }

    pub fn adjacent(&self, delta: isize) -> Option<SharedString> {
        self.adjacent_from(self.active.as_deref(), delta)
    }

    pub fn adjacent_from(&self, from: Option<&str>, delta: isize) -> Option<SharedString> {
        if self.tabs.is_empty() {
            return None;
        }
        let index = from
            .and_then(|id| self.tabs.iter().position(|tab| tab.id.as_ref() == id))
            .or_else(|| {
                self.active
                    .as_ref()
                    .and_then(|id| self.tabs.iter().position(|t| t.id == *id))
            })?;
        let next = (index.cast_signed() + delta)
            .rem_euclid(self.tabs.len().cast_signed())
            .cast_unsigned();
        Some(self.tabs[next].id.clone())
    }
}

#[derive(Clone, Debug, PartialEq)]
pub enum PaneNode {
    Pane(PaneState),
    Split {
        axis: SplitAxis,
        ratio: f32,
        first: Box<Self>,
        second: Box<Self>,
    },
}

impl PaneNode {
    pub fn split(axis: SplitAxis, ratio: f32, first: Self, second: Self) -> Self {
        Self::Split {
            axis,
            ratio: ratio.clamp(0.1, 0.9),
            first: Box::new(first),
            second: Box::new(second),
        }
    }

    fn mutate_pane(&mut self, pane_id: &str, f: &mut impl FnMut(&mut PaneState)) -> bool {
        match self {
            Self::Pane(pane) if pane.id.as_ref() == pane_id => {
                f(pane);
                true
            }
            Self::Pane(_) => false,
            Self::Split { first, second, .. } => {
                first.mutate_pane(pane_id, f) || second.mutate_pane(pane_id, f)
            }
        }
    }

    fn split_pane(&mut self, pane_id: &str, new_pane_id: &str, axis: SplitAxis) -> bool {
        match self {
            Self::Pane(pane) if pane.id.as_ref() == pane_id => {
                let first = Self::Pane(pane.clone());
                let second = Self::Pane(PaneState::new(new_pane_id.to_owned()));
                *self = Self::split(axis, 0.5, first, second);
                true
            }
            Self::Pane(_) => false,
            Self::Split { first, second, .. } => {
                first.split_pane(pane_id, new_pane_id, axis)
                    || second.split_pane(pane_id, new_pane_id, axis)
            }
        }
    }

    fn pane_ids(&self, ids: &mut BTreeSet<SharedString>) {
        match self {
            Self::Pane(pane) => {
                ids.insert(pane.id.clone());
            }
            Self::Split { first, second, .. } => {
                first.pane_ids(ids);
                second.pane_ids(ids);
            }
        }
    }

    fn validate_tree(
        &self,
        pane_ids: &mut BTreeSet<SharedString>,
        item_ids: &mut BTreeSet<SharedString>,
    ) -> Result<(), LayoutValidationError> {
        match self {
            Self::Pane(pane) => {
                if !pane_ids.insert(pane.id.clone()) {
                    return Err(LayoutValidationError::DuplicatePaneId(pane.id.clone()));
                }
                for tab in &pane.tabs {
                    if !item_ids.insert(tab.id.clone()) {
                        return Err(LayoutValidationError::DuplicateItemId(tab.id.clone()));
                    }
                }
                if let Some(active) = &pane.active
                    && !pane.tabs.iter().any(|tab| tab.id == *active)
                {
                    return Err(LayoutValidationError::ActiveItemMissing {
                        pane: pane.id.clone(),
                        item: active.clone(),
                    });
                }
                Ok(())
            }
            Self::Split {
                ratio,
                first,
                second,
                ..
            } => {
                if !ratio.is_finite() {
                    return Err(LayoutValidationError::NonFiniteSplitRatio);
                }
                if !(0.1..=0.9).contains(ratio) {
                    return Err(LayoutValidationError::InvalidSplitRatio);
                }
                first.validate_tree(pane_ids, item_ids)?;
                second.validate_tree(pane_ids, item_ids)
            }
        }
    }
}

#[derive(Clone, Debug, PartialEq)]
pub struct WorkspaceLayout {
    pub version: u16,
    pub panels: BTreeMap<SharedString, PanelState>,
    pub root: PaneNode,
    pub focused_pane: Option<SharedString>,
}

impl WorkspaceLayout {
    pub const CURRENT_VERSION: u16 = 1;

    pub fn reduced(&self, action: &WorkspaceAction) -> Self {
        let mut next = self.clone();
        match action {
            WorkspaceAction::FocusPane(id) => {
                let found = next.root.mutate_pane(id, &mut |_| {});
                if found {
                    next.focused_pane = Some(id.clone());
                }
            }
            WorkspaceAction::SelectItem { pane, item } => {
                next.root.mutate_pane(pane, &mut |state| {
                    if state.tabs.iter().any(|tab| tab.id == *item) {
                        state.active = Some(item.clone());
                    }
                });
            }
            WorkspaceAction::CloseItem { pane, item } => {
                next.root.mutate_pane(pane, &mut |state| {
                    if let Some(index) = state.tabs.iter().position(|tab| tab.id == *item) {
                        state.tabs.remove(index);
                        if state.active.as_ref() == Some(item) {
                            state.active = state
                                .tabs
                                .get(index.min(state.tabs.len().saturating_sub(1)))
                                .map(|tab| tab.id.clone());
                        }
                    }
                });
            }
            WorkspaceAction::SplitPane { pane, axis } => {
                let mut ids = BTreeSet::new();
                next.root.pane_ids(&mut ids);
                let mut ordinal = 1;
                let new_id = loop {
                    let candidate: SharedString = format!("{pane}-split-{ordinal}").into();
                    if !ids.contains(&candidate) {
                        break candidate;
                    }
                    ordinal += 1;
                };
                next.root.split_pane(pane, &new_id, *axis);
            }
            WorkspaceAction::ResizePanel { id, delta } => {
                if let Some(panel) = next.panels.get_mut(id) {
                    *panel = panel.resized(*delta);
                }
            }
            WorkspaceAction::TogglePanel(id) => {
                if let Some(panel) = next.panels.get_mut(id) {
                    *panel = panel.toggled();
                }
            }
            WorkspaceAction::SelectAdjacentTab { pane, from, delta } => {
                next.root.mutate_pane(pane, &mut |state| {
                    if let Some(item) = state.adjacent_from(Some(from), *delta) {
                        state.active = Some(item);
                    }
                });
            }
            _ => {}
        }
        next
    }

    pub fn panel_action(&self, action: &WorkspaceAction) -> Self {
        self.reduced(action)
    }
    pub fn validate(&self) -> Result<(), LayoutValidationError> {
        if self.version != Self::CURRENT_VERSION {
            return Err(LayoutValidationError::UnsupportedVersion(self.version));
        }
        for (key, panel) in &self.panels {
            if key != &panel.id {
                return Err(LayoutValidationError::PanelKeyMismatch {
                    key: key.clone(),
                    id: panel.id.clone(),
                });
            }
            panel.validate()?;
        }
        let mut pane_ids = BTreeSet::new();
        let mut item_ids = BTreeSet::new();
        self.root.validate_tree(&mut pane_ids, &mut item_ids)?;
        if let Some(focused) = &self.focused_pane
            && !pane_ids.contains(focused)
        {
            return Err(LayoutValidationError::FocusedPaneMissing(focused.clone()));
        }
        Ok(())
    }
}

pub trait LayoutStore {
    type Error;
    /// Restores a layout, or `None` when no layout has been saved.
    ///
    /// # Errors
    /// Returns the backing store's read error.
    fn load(&self, workspace_id: &str) -> Result<Option<WorkspaceLayout>, Self::Error>;
    /// Persists the complete versioned layout.
    ///
    /// # Errors
    /// Returns the backing store's write error.
    fn save(&mut self, workspace_id: &str, layout: &WorkspaceLayout) -> Result<(), Self::Error>;
}

#[derive(Clone, Debug, PartialEq)]
pub enum WorkspaceAction {
    FocusPane(SharedString),
    SelectItem {
        pane: SharedString,
        item: SharedString,
    },
    CloseItem {
        pane: SharedString,
        item: SharedString,
    },
    SplitPane {
        pane: SharedString,
        axis: SplitAxis,
    },
    TogglePanel(SharedString),
    ResizePanel {
        id: SharedString,
        delta: f32,
    },
    NavigateBack,
    NavigateForward,
    OpenBreadcrumb(SharedString),
    ActivateActivity(SharedString),
    OpenProjectEntry(SharedString),
    ToggleProjectEntry(SharedString),
    OpenPalette,
    ClosePalette,
    UpdatePalette(SharedString),
    SelectPaletteResult(SharedString),
    ActivatePaletteResult(SharedString),
    SelectAdjacentTab {
        pane: SharedString,
        from: SharedString,
        delta: isize,
    },
    DismissToast(SharedString),
    CancelTask(SharedString),
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum WorkspaceKeyContext {
    Global,
    Pane,
    ProjectTree,
    Palette,
}

#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct InteractionState {
    pub focused_pane: Option<SharedString>,
    pub focused_tree_entry: Option<SharedString>,
    pub selected_palette_item: Option<SharedString>,
    pub focused_breadcrumb: Option<SharedString>,
    pub focused_tab: Option<(SharedString, SharedString)>,
}

pub fn keyboard_action(
    key: &str,
    secondary: bool,
    shift: bool,
    context: WorkspaceKeyContext,
    state: &InteractionState,
) -> Option<WorkspaceAction> {
    match (key, secondary, shift, context) {
        ("p", true, false, _) => Some(WorkspaceAction::OpenPalette),
        ("[", true, false, _) => Some(WorkspaceAction::NavigateBack),
        ("]", true, false, _) => Some(WorkspaceAction::NavigateForward),
        ("enter" | "space", _, _, WorkspaceKeyContext::ProjectTree) => state
            .focused_tree_entry
            .clone()
            .map(WorkspaceAction::OpenProjectEntry),
        ("enter", _, _, WorkspaceKeyContext::Palette) => state
            .selected_palette_item
            .clone()
            .map(WorkspaceAction::SelectPaletteResult),
        ("escape", _, _, WorkspaceKeyContext::Palette) => Some(WorkspaceAction::ClosePalette),
        ("enter" | "space", _, _, WorkspaceKeyContext::Global) => state
            .focused_breadcrumb
            .clone()
            .map(WorkspaceAction::OpenBreadcrumb),
        ("left", _, _, WorkspaceKeyContext::Pane) => {
            state
                .focused_tab
                .as_ref()
                .map(|(pane, item)| WorkspaceAction::SelectAdjacentTab {
                    pane: pane.clone(),
                    from: item.clone(),
                    delta: -1,
                })
        }
        ("right", _, _, WorkspaceKeyContext::Pane) => {
            state
                .focused_tab
                .as_ref()
                .map(|(pane, item)| WorkspaceAction::SelectAdjacentTab {
                    pane: pane.clone(),
                    from: item.clone(),
                    delta: 1,
                })
        }
        _ => None,
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Breadcrumb {
    pub label: SharedString,
    pub path: SharedString,
}

#[derive(IntoElement)]
pub struct NavigationBar {
    id: ElementId,
    can_go_back: bool,
    can_go_forward: bool,
    theme: AuroraTheme,
    on_action: Option<ActionHandler>,
}
impl NavigationBar {
    pub fn new(id: impl Into<ElementId>) -> Self {
        Self {
            id: id.into(),
            can_go_back: false,
            can_go_forward: false,
            theme: AuroraTheme::default(),
            on_action: None,
        }
    }
    pub const fn history(mut self, can_go_back: bool, can_go_forward: bool) -> Self {
        self.can_go_back = can_go_back;
        self.can_go_forward = can_go_forward;
        self
    }
    pub fn on_action(
        mut self,
        f: impl Fn(WorkspaceAction, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_action = Some(Rc::new(f));
        self
    }
}
impl RenderOnce for NavigationBar {
    fn render(self, _: &mut Window, _: &mut App) -> impl IntoElement {
        surface(self.theme)
            .id(self.id)
            .role(gpui::Role::Navigation)
            .aria_label("Navigation History")
            .flex()
            .gap(px(self.theme.space.xs))
            .children(
                [
                    (WorkspaceAction::NavigateBack, "Back", self.can_go_back),
                    (
                        WorkspaceAction::NavigateForward,
                        "Forward",
                        self.can_go_forward,
                    ),
                ]
                .into_iter()
                .enumerate()
                .map(|(index, (action, label, enabled))| {
                    let handler = self.on_action.clone();
                    let keyboard = self.on_action.clone();
                    let accessible = self.on_action.clone();
                    let click_action = action.clone();
                    let key_action = action.clone();
                    div()
                        .id(("history", index))
                        .role(gpui::Role::Button)
                        .aria_label(label)
                        .when(!enabled, |e| e.opacity(0.45))
                        .when(enabled, gpui::Styled::cursor_pointer)
                        .when(enabled, |e| e.focusable().tab_index(0))
                        .on_click(move |_, w, cx| {
                            if enabled && let Some(f) = &handler {
                                f(click_action.clone(), w, cx);
                            }
                        })
                        .on_key_down({
                            move |event, w, cx| {
                                if enabled
                                    && matches!(event.keystroke.key.as_str(), "enter" | "space")
                                    && let Some(f) = &keyboard
                                {
                                    f(key_action.clone(), w, cx);
                                }
                            }
                        })
                        .on_a11y_action(AccessibleAction::Click, move |_, w, cx| {
                            if enabled && let Some(f) = &accessible {
                                f(action.clone(), w, cx);
                            }
                        })
                        .child(label)
                }),
            )
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ProjectEntry {
    pub id: SharedString,
    pub label: SharedString,
    pub depth: u16,
    pub directory: bool,
    pub expanded: bool,
    pub selected: bool,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct PaletteItem {
    pub id: SharedString,
    pub label: SharedString,
    pub detail: Option<SharedString>,
}

pub fn filter_palette(items: &[PaletteItem], query: &str) -> Vec<PaletteItem> {
    let terms = query.to_lowercase();
    items
        .iter()
        .filter(|item| {
            item.label.to_lowercase().contains(&terms)
                || item
                    .detail
                    .as_ref()
                    .is_some_and(|d| d.to_lowercase().contains(&terms))
        })
        .cloned()
        .collect()
}

pub fn clamp_selection(selected: usize, item_count: usize) -> Option<usize> {
    (item_count > 0).then(|| selected.min(item_count - 1))
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct OutlineEntry {
    pub id: SharedString,
    pub label: SharedString,
    pub depth: u16,
    pub selected: bool,
}

#[derive(IntoElement)]
pub struct Outline {
    id: ElementId,
    entries: Vec<OutlineEntry>,
    theme: AuroraTheme,
}
impl Outline {
    pub fn new(id: impl Into<ElementId>) -> Self {
        Self {
            id: id.into(),
            entries: vec![],
            theme: AuroraTheme::default(),
        }
    }
    pub fn entries(mut self, entries: impl IntoIterator<Item = OutlineEntry>) -> Self {
        self.entries = entries.into_iter().collect();
        self
    }
}
impl RenderOnce for Outline {
    fn render(self, _: &mut Window, _: &mut App) -> impl IntoElement {
        surface(self.theme)
            .id(self.id)
            .role(gpui::Role::Tree)
            .aria_label("Document Outline")
            .flex()
            .flex_col()
            .children(self.entries.into_iter().map(|entry| {
                div()
                    .id(entry.id)
                    .role(gpui::Role::TreeItem)
                    .aria_label(entry.label.clone())
                    .aria_selected(entry.selected)
                    .pl(px(
                        self.theme.space.sm + f32::from(entry.depth) * self.theme.space.md
                    ))
                    .when(entry.selected, |e| {
                        e.bg(gpui::Hsla::from(self.theme.colors.surface_active))
                    })
                    .child(entry.label)
            }))
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ToastTone {
    Info,
    Success,
    Warning,
    Danger,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Toast {
    pub id: SharedString,
    pub message: SharedString,
    pub tone: ToastTone,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct TaskStatus {
    pub id: SharedString,
    pub label: SharedString,
    pub percent: Option<u8>,
    pub cancellable: bool,
}

#[derive(IntoElement)]
pub struct ProgressIndicator {
    id: ElementId,
    task: TaskStatus,
    theme: AuroraTheme,
    on_action: Option<ActionHandler>,
}
impl ProgressIndicator {
    pub fn new(id: impl Into<ElementId>, task: TaskStatus) -> Self {
        Self {
            id: id.into(),
            task,
            theme: AuroraTheme::default(),
            on_action: None,
        }
    }
    pub fn on_action(
        mut self,
        f: impl Fn(WorkspaceAction, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_action = Some(Rc::new(f));
        self
    }
}
impl RenderOnce for ProgressIndicator {
    fn render(self, _: &mut Window, _: &mut App) -> impl IntoElement {
        let text = match self.task.percent {
            Some(percent) => format!("{} {percent}%", self.task.label),
            None => format!("{}…", self.task.label),
        };
        let task_id = self.task.id.clone();
        let click_id = task_id.clone();
        let key_id = task_id.clone();
        let a11y_id = task_id.clone();
        let click = self.on_action.clone();
        let key = self.on_action.clone();
        let accessible = self.on_action.clone();
        surface(self.theme)
            .id(self.id)
            .role(gpui::Role::ProgressIndicator)
            .aria_label(text.clone())
            .child(text)
            .when(self.task.cancellable, |e| {
                e.child(
                    div()
                        .id(format!("cancel-task-{task_id}"))
                        .role(gpui::Role::Button)
                        .aria_label("Cancel Task")
                        .focusable()
                        .tab_index(0)
                        .cursor_pointer()
                        .on_click(move |_, w, cx| {
                            if let Some(f) = &click {
                                f(WorkspaceAction::CancelTask(click_id.clone()), w, cx);
                            }
                        })
                        .on_key_down(move |event, w, cx| {
                            if matches!(event.keystroke.key.as_str(), "enter" | "space")
                                && let Some(f) = &key
                            {
                                f(WorkspaceAction::CancelTask(key_id.clone()), w, cx);
                            }
                        })
                        .on_a11y_action(AccessibleAction::Click, move |_, w, cx| {
                            if let Some(f) = &accessible {
                                f(WorkspaceAction::CancelTask(a11y_id.clone()), w, cx);
                            }
                        })
                        .child("Cancel"),
                )
            })
    }
}

fn surface(theme: AuroraTheme) -> gpui::Div {
    div()
        .bg(gpui::Hsla::from(theme.colors.surface))
        .text_color(theme.colors.text)
        .border_color(theme.colors.border)
}

#[derive(IntoElement)]
pub struct TitleBar {
    id: ElementId,
    title: SharedString,
    theme: AuroraTheme,
}
impl TitleBar {
    pub fn new(id: impl Into<ElementId>, title: impl Into<SharedString>) -> Self {
        Self {
            id: id.into(),
            title: title.into(),
            theme: AuroraTheme::default(),
        }
    }
    pub const fn theme(mut self, theme: AuroraTheme) -> Self {
        self.theme = theme;
        self
    }
}
impl RenderOnce for TitleBar {
    fn render(self, _: &mut Window, _: &mut App) -> impl IntoElement {
        surface(self.theme)
            .id(self.id)
            .role(gpui::Role::Heading)
            .aria_label("Workspace Title")
            .h(px(36.))
            .px(px(self.theme.space.md))
            .flex()
            .items_center()
            .border_b_1()
            .child(self.title)
    }
}

#[derive(IntoElement)]
pub struct StatusBar {
    id: ElementId,
    items: Vec<SharedString>,
    tasks: Vec<TaskStatus>,
    theme: AuroraTheme,
}
impl StatusBar {
    pub fn new(id: impl Into<ElementId>) -> Self {
        Self {
            id: id.into(),
            items: vec![],
            tasks: vec![],
            theme: AuroraTheme::default(),
        }
    }
    pub fn items(mut self, items: impl IntoIterator<Item = impl Into<SharedString>>) -> Self {
        self.items = items.into_iter().map(Into::into).collect();
        self
    }
    pub fn tasks(mut self, tasks: impl IntoIterator<Item = TaskStatus>) -> Self {
        self.tasks = tasks.into_iter().collect();
        self
    }
    pub const fn theme(mut self, theme: AuroraTheme) -> Self {
        self.theme = theme;
        self
    }
}
impl RenderOnce for StatusBar {
    fn render(self, _: &mut Window, _: &mut App) -> impl IntoElement {
        surface(self.theme)
            .id(self.id)
            .role(gpui::Role::Status)
            .aria_label("Workspace Status")
            .h(px(28.))
            .px(px(self.theme.space.sm))
            .flex()
            .items_center()
            .justify_between()
            .border_t_1()
            .child(
                div()
                    .flex()
                    .gap(px(self.theme.space.md))
                    .children(self.items),
            )
            .child(div().children(self.tasks.into_iter().map(|task| {
                div()
                    .id(task.id)
                    .role(gpui::Role::Status)
                    .aria_label(task.label.clone())
                    .child(match task.percent {
                        Some(p) => format!("{} {p}%", task.label),
                        None => task.label.to_string(),
                    })
            })))
    }
}

#[derive(IntoElement)]
pub struct ActivityBar {
    id: ElementId,
    items: Vec<(SharedString, SharedString)>,
    active: Option<SharedString>,
    theme: AuroraTheme,
    on_action: Option<ActionHandler>,
}
impl ActivityBar {
    pub fn new(id: impl Into<ElementId>) -> Self {
        Self {
            id: id.into(),
            items: vec![],
            active: None,
            theme: AuroraTheme::default(),
            on_action: None,
        }
    }
    pub fn items(
        mut self,
        items: impl IntoIterator<Item = (impl Into<SharedString>, impl Into<SharedString>)>,
    ) -> Self {
        self.items = items
            .into_iter()
            .map(|(id, label)| (id.into(), label.into()))
            .collect();
        self
    }
    pub fn active(mut self, id: impl Into<SharedString>) -> Self {
        self.active = Some(id.into());
        self
    }
    pub fn on_action(
        mut self,
        f: impl Fn(WorkspaceAction, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_action = Some(Rc::new(f));
        self
    }
}
impl RenderOnce for ActivityBar {
    fn render(self, _: &mut Window, _: &mut App) -> impl IntoElement {
        surface(self.theme)
            .id(self.id)
            .role(gpui::Role::Navigation)
            .aria_label("Workspace Activities")
            .w(px(44.))
            .flex()
            .flex_col()
            .border_r_1()
            .children(self.items.into_iter().map(|(id, label)| {
                let selected = self.active.as_ref() == Some(&id);
                let handler = self.on_action.clone();
                div()
                    .id(id.clone())
                    .role(gpui::Role::Button)
                    .aria_label(label.clone())
                    .aria_selected(selected)
                    .p(px(self.theme.space.sm))
                    .when(selected, |e| {
                        e.bg(gpui::Hsla::from(self.theme.colors.surface_active))
                    })
                    .on_click(move |_, w, cx| {
                        if let Some(f) = &handler {
                            f(WorkspaceAction::ActivateActivity(id.clone()), w, cx);
                        }
                    })
                    .child(label)
            }))
    }
}

#[derive(IntoElement)]
pub struct BreadcrumbBar {
    id: ElementId,
    crumbs: Vec<Breadcrumb>,
    theme: AuroraTheme,
    on_action: Option<ActionHandler>,
}
impl BreadcrumbBar {
    pub fn new(id: impl Into<ElementId>) -> Self {
        Self {
            id: id.into(),
            crumbs: vec![],
            theme: AuroraTheme::default(),
            on_action: None,
        }
    }
    pub fn crumbs(mut self, crumbs: impl IntoIterator<Item = Breadcrumb>) -> Self {
        self.crumbs = crumbs.into_iter().collect();
        self
    }
    pub fn on_action(
        mut self,
        f: impl Fn(WorkspaceAction, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_action = Some(Rc::new(f));
        self
    }
}
impl RenderOnce for BreadcrumbBar {
    fn render(self, _: &mut Window, _: &mut App) -> impl IntoElement {
        surface(self.theme)
            .id(self.id)
            .role(gpui::Role::Navigation)
            .aria_label("Breadcrumbs")
            .flex()
            .gap(px(self.theme.space.xs))
            .px(px(self.theme.space.sm))
            .children(
                self.crumbs
                    .into_iter()
                    .enumerate()
                    .flat_map(|(index, crumb)| {
                        let id = crumb.path.clone();
                        let click_id = id.clone();
                        let key_id = id.clone();
                        let a11y_id = id.clone();
                        let click = self.on_action.clone();
                        let key = self.on_action.clone();
                        let accessible = self.on_action.clone();
                        [
                            div()
                                .id(id)
                                .role(gpui::Role::Button)
                                .aria_label(crumb.path)
                                .focusable()
                                .tab_index(0)
                                .cursor_pointer()
                                .on_click(move |_, w, cx| {
                                    if let Some(f) = &click {
                                        f(WorkspaceAction::OpenBreadcrumb(click_id.clone()), w, cx);
                                    }
                                })
                                .on_key_down(move |event, w, cx| {
                                    if matches!(event.keystroke.key.as_str(), "enter" | "space")
                                        && let Some(f) = &key
                                    {
                                        f(WorkspaceAction::OpenBreadcrumb(key_id.clone()), w, cx);
                                    }
                                })
                                .on_a11y_action(AccessibleAction::Click, move |_, w, cx| {
                                    if let Some(f) = &accessible {
                                        f(WorkspaceAction::OpenBreadcrumb(a11y_id.clone()), w, cx);
                                    }
                                })
                                .child(crumb.label),
                            div().id(("separator", index)).child("/"),
                        ]
                    }),
            )
    }
}

#[derive(IntoElement)]
pub struct ProjectTree {
    id: ElementId,
    entries: Vec<ProjectEntry>,
    theme: AuroraTheme,
    on_action: Option<ActionHandler>,
}
impl ProjectTree {
    pub fn new(id: impl Into<ElementId>) -> Self {
        Self {
            id: id.into(),
            entries: vec![],
            theme: AuroraTheme::default(),
            on_action: None,
        }
    }
    pub fn entries(mut self, entries: impl IntoIterator<Item = ProjectEntry>) -> Self {
        self.entries = entries.into_iter().collect();
        self
    }
    pub fn on_action(
        mut self,
        f: impl Fn(WorkspaceAction, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_action = Some(Rc::new(f));
        self
    }
}
impl RenderOnce for ProjectTree {
    fn render(self, _: &mut Window, _: &mut App) -> impl IntoElement {
        surface(self.theme)
            .id(self.id)
            .role(gpui::Role::Tree)
            .aria_label("Project Files")
            .flex()
            .flex_col()
            .children(self.entries.into_iter().map(|entry| {
                let id = entry.id.clone();
                let element_id = entry.id.clone();
                let key_id = entry.id.clone();
                let click = self.on_action.clone();
                let key = self.on_action.clone();
                let directory = entry.directory;
                div()
                    .id(element_id)
                    .role(gpui::Role::TreeItem)
                    .aria_label(entry.label.clone())
                    .aria_selected(entry.selected)
                    .focusable()
                    .tab_index(0)
                    .on_click(move |_, w, cx| {
                        if let Some(f) = &click {
                            f(
                                if directory {
                                    WorkspaceAction::ToggleProjectEntry(id.clone())
                                } else {
                                    WorkspaceAction::OpenProjectEntry(id.clone())
                                },
                                w,
                                cx,
                            );
                        }
                    })
                    .on_key_down(move |event, w, cx| {
                        if matches!(event.keystroke.key.as_str(), "enter" | "space")
                            && let Some(f) = &key
                        {
                            f(
                                if directory {
                                    WorkspaceAction::ToggleProjectEntry(key_id.clone())
                                } else {
                                    WorkspaceAction::OpenProjectEntry(key_id.clone())
                                },
                                w,
                                cx,
                            );
                        }
                    })
                    .pl(px(
                        self.theme.space.sm + f32::from(entry.depth) * self.theme.space.md
                    ))
                    .py(px(self.theme.space.xs))
                    .when(entry.selected, |e| {
                        e.bg(gpui::Hsla::from(self.theme.colors.surface_active))
                    })
                    .child(format!(
                        "{}{}",
                        if entry.directory {
                            if entry.expanded { "▾ " } else { "▸ " }
                        } else {
                            ""
                        },
                        entry.label
                    ))
            }))
    }
}

#[derive(IntoElement)]
pub struct PaneTabs {
    id: ElementId,
    pane: PaneState,
    theme: AuroraTheme,
    on_action: Option<ActionHandler>,
}
impl PaneTabs {
    pub fn new(id: impl Into<ElementId>, pane: PaneState) -> Self {
        Self {
            id: id.into(),
            pane,
            theme: AuroraTheme::default(),
            on_action: None,
        }
    }
    pub fn on_action(
        mut self,
        f: impl Fn(WorkspaceAction, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_action = Some(Rc::new(f));
        self
    }
}
impl RenderOnce for PaneTabs {
    fn render(self, _: &mut Window, _: &mut App) -> impl IntoElement {
        surface(self.theme)
            .id(self.id)
            .role(gpui::Role::TabList)
            .aria_label("Open Items")
            .flex()
            .children(self.pane.tabs.into_iter().map(|tab| {
                let selected = self.pane.active.as_ref() == Some(&tab.id);
                let pane = self.pane.id.clone();
                let item = tab.id.clone();
                let element_id = tab.id.clone();
                let key_pane = self.pane.id.clone();
                let key_item = tab.id.clone();
                let click = self.on_action.clone();
                let key = self.on_action.clone();
                div()
                    .id(element_id)
                    .role(gpui::Role::Tab)
                    .aria_label(tab.label.clone())
                    .aria_selected(selected)
                    .focusable()
                    .tab_index(0)
                    .on_click(move |_, w, cx| {
                        if let Some(f) = &click {
                            f(
                                WorkspaceAction::SelectItem {
                                    pane: pane.clone(),
                                    item: item.clone(),
                                },
                                w,
                                cx,
                            );
                        }
                    })
                    .on_key_down(move |event, w, cx| {
                        if matches!(event.keystroke.key.as_str(), "enter" | "space")
                            && let Some(f) = &key
                        {
                            f(
                                WorkspaceAction::SelectItem {
                                    pane: key_pane.clone(),
                                    item: key_item.clone(),
                                },
                                w,
                                cx,
                            );
                        }
                    })
                    .px(px(self.theme.space.md))
                    .py(px(self.theme.space.sm))
                    .when(selected, |e| {
                        e.bg(gpui::Hsla::from(self.theme.colors.surface_active))
                            .border_b_2()
                            .border_color(self.theme.colors.primary)
                    })
                    .child(format!(
                        "{}{}",
                        tab.label,
                        if tab.dirty { " •" } else { "" }
                    ))
            }))
    }
}

#[derive(IntoElement)]
pub struct DockPanel {
    id: ElementId,
    label: SharedString,
    state: PanelState,
    theme: AuroraTheme,
    on_action: Option<ActionHandler>,
}
impl DockPanel {
    pub fn new(
        id: impl Into<ElementId>,
        label: impl Into<SharedString>,
        state: PanelState,
    ) -> Self {
        Self {
            id: id.into(),
            label: label.into(),
            state,
            theme: AuroraTheme::default(),
            on_action: None,
        }
    }
    pub fn on_action(
        mut self,
        f: impl Fn(WorkspaceAction, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_action = Some(Rc::new(f));
        self
    }
}
impl RenderOnce for DockPanel {
    fn render(self, _: &mut Window, _: &mut App) -> impl IntoElement {
        let toggle_id = self.state.id.clone();
        let toggle_key_id = self.state.id.clone();
        let toggle_a11y_id = self.state.id.clone();
        let resize_id = self.state.id.clone();
        let resize_a11y_id = self.state.id.clone();
        let toggle = self.on_action.clone();
        let toggle_key = self.on_action.clone();
        let toggle_accessible = self.on_action.clone();
        let resize = self.on_action.clone();
        let resize_accessible = self.on_action.clone();
        surface(self.theme)
            .id(self.id)
            .role(gpui::Role::Region)
            .aria_label(self.label.clone())
            .when(self.state.collapsed, |e| e.h(px(0.)).w(px(0.)))
            .when(
                !self.state.collapsed && self.state.dock == DockPosition::Bottom,
                |e| e.h(px(self.state.size)),
            )
            .when(
                !self.state.collapsed && self.state.dock != DockPosition::Bottom,
                |e| e.w(px(self.state.size)),
            )
            .border_1()
            .child(self.label)
            .child(
                div()
                    .id(format!("toggle-panel-{}", self.state.id))
                    .role(gpui::Role::Button)
                    .aria_label("Toggle Panel")
                    .focusable()
                    .tab_index(0)
                    .on_click(move |_, w, cx| {
                        if let Some(f) = &toggle {
                            f(WorkspaceAction::TogglePanel(toggle_id.clone()), w, cx);
                        }
                    })
                    .on_key_down(move |event, w, cx| {
                        if matches!(event.keystroke.key.as_str(), "enter" | "space")
                            && let Some(f) = &toggle_key
                        {
                            f(WorkspaceAction::TogglePanel(toggle_key_id.clone()), w, cx);
                        }
                    })
                    .on_a11y_action(AccessibleAction::Click, move |_, w, cx| {
                        if let Some(f) = &toggle_accessible {
                            f(WorkspaceAction::TogglePanel(toggle_a11y_id.clone()), w, cx);
                        }
                    })
                    .child(if self.state.collapsed {
                        "Expand"
                    } else {
                        "Collapse"
                    }),
            )
            .child(
                div()
                    .id(format!("resize-panel-{}", self.state.id))
                    .role(gpui::Role::Button)
                    .aria_label("Resize Panel")
                    .focusable()
                    .tab_index(0)
                    .on_key_down(move |event, w, cx| {
                        let delta = match event.keystroke.key.as_str() {
                            "left" | "down" => -16.0,
                            "right" | "up" => 16.0,
                            _ => return,
                        };
                        if let Some(f) = &resize {
                            f(
                                WorkspaceAction::ResizePanel {
                                    id: resize_id.clone(),
                                    delta,
                                },
                                w,
                                cx,
                            );
                        }
                    })
                    .on_a11y_action(AccessibleAction::Increment, move |_, w, cx| {
                        if let Some(f) = &resize_accessible {
                            f(
                                WorkspaceAction::ResizePanel {
                                    id: resize_a11y_id.clone(),
                                    delta: 16.0,
                                },
                                w,
                                cx,
                            );
                        }
                    })
                    .child("Resize"),
            )
    }
}

#[derive(IntoElement)]
pub struct CommandPalette {
    id: ElementId,
    query: SharedString,
    items: Vec<PaletteItem>,
    selected: usize,
    theme: AuroraTheme,
    on_action: Option<ActionHandler>,
}
impl CommandPalette {
    pub fn new(id: impl Into<ElementId>) -> Self {
        Self {
            id: id.into(),
            query: "".into(),
            items: vec![],
            selected: 0,
            theme: AuroraTheme::default(),
            on_action: None,
        }
    }
    pub fn query(mut self, query: impl Into<SharedString>) -> Self {
        self.query = query.into();
        self
    }
    pub fn items(mut self, items: impl IntoIterator<Item = PaletteItem>) -> Self {
        self.items = items.into_iter().collect();
        self
    }
    pub const fn selected(mut self, selected: usize) -> Self {
        self.selected = selected;
        self
    }
    pub fn on_action(
        mut self,
        f: impl Fn(WorkspaceAction, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_action = Some(Rc::new(f));
        self
    }
}
impl RenderOnce for CommandPalette {
    #[allow(clippy::too_many_lines)]
    fn render(self, _: &mut Window, _: &mut App) -> impl IntoElement {
        let matches = filter_palette(&self.items, &self.query);
        let selected = clamp_selection(self.selected, matches.len());
        let keyboard_matches = matches.clone();
        let query = self.query.clone();
        let input_handler = self.on_action.clone();
        let selected_id = selected.and_then(|index| matches.get(index).map(|item| item.id.clone()));
        surface(self.theme)
            .id(self.id)
            .role(gpui::Role::Dialog)
            .aria_label("Command Palette")
            .p(px(self.theme.space.md))
            .border_1()
            .rounded(px(self.theme.radii.lg))
            .child(
                div()
                    .id("palette-input")
                    .role(gpui::Role::TextInput)
                    .aria_label("Search Commands")
                    .aria_value(self.query.clone())
                    .focusable()
                    .tab_index(0)
                    .on_key_down(move |event, w, cx| {
                        let Some(f) = &input_handler else { return };
                        match event.keystroke.key.as_str() {
                            "escape" => f(WorkspaceAction::ClosePalette, w, cx),
                            "enter" => {
                                if let Some(id) = &selected_id {
                                    f(WorkspaceAction::ActivatePaletteResult(id.clone()), w, cx);
                                }
                            }
                            "up" | "down" => {
                                let count = keyboard_matches.len();
                                if count > 0 {
                                    let current = selected.unwrap_or(0);
                                    let next = if event.keystroke.key == "up" {
                                        (current + count - 1) % count
                                    } else {
                                        (current + 1) % count
                                    };
                                    f(
                                        WorkspaceAction::SelectPaletteResult(
                                            keyboard_matches[next].id.clone(),
                                        ),
                                        w,
                                        cx,
                                    );
                                }
                            }
                            "backspace" => {
                                let mut value = query.to_string();
                                value.pop();
                                f(WorkspaceAction::UpdatePalette(value.into()), w, cx);
                            }
                            key if key.chars().count() == 1
                                && !event.keystroke.modifiers.platform
                                && !event.keystroke.modifiers.control
                                && !event.keystroke.modifiers.alt =>
                            {
                                f(
                                    WorkspaceAction::UpdatePalette(format!("{query}{key}").into()),
                                    w,
                                    cx,
                                );
                            }
                            _ => {}
                        }
                    })
                    .child(self.query),
            )
            .child(
                div()
                    .id("palette-results")
                    .role(gpui::Role::ListBox)
                    .children(matches.into_iter().enumerate().map(|(index, item)| {
                        let id = item.id.clone();
                        let click_id = id.clone();
                        let key_id = id.clone();
                        let a11y_id = id.clone();
                        let click = self.on_action.clone();
                        let key = self.on_action.clone();
                        let accessible = self.on_action.clone();
                        div()
                            .id(id)
                            .role(gpui::Role::ListBoxOption)
                            .aria_selected(selected == Some(index))
                            .focusable()
                            .tab_index(0)
                            .cursor_pointer()
                            .on_click(move |_, w, cx| {
                                if let Some(f) = &click {
                                    f(
                                        WorkspaceAction::ActivatePaletteResult(click_id.clone()),
                                        w,
                                        cx,
                                    );
                                }
                            })
                            .on_key_down(move |event, w, cx| {
                                if matches!(event.keystroke.key.as_str(), "enter" | "space")
                                    && let Some(f) = &key
                                {
                                    f(
                                        WorkspaceAction::ActivatePaletteResult(key_id.clone()),
                                        w,
                                        cx,
                                    );
                                }
                            })
                            .on_a11y_action(AccessibleAction::Click, move |_, w, cx| {
                                if let Some(f) = &accessible {
                                    f(
                                        WorkspaceAction::ActivatePaletteResult(a11y_id.clone()),
                                        w,
                                        cx,
                                    );
                                }
                            })
                            .when(selected == Some(index), |e| {
                                e.bg(gpui::Hsla::from(self.theme.colors.surface_active))
                            })
                            .child(item.label)
                    })),
            )
    }
}

#[derive(IntoElement)]
pub struct ToastStack {
    id: ElementId,
    toasts: Vec<Toast>,
    theme: AuroraTheme,
    on_action: Option<ActionHandler>,
}
impl ToastStack {
    pub fn new(id: impl Into<ElementId>) -> Self {
        Self {
            id: id.into(),
            toasts: vec![],
            theme: AuroraTheme::default(),
            on_action: None,
        }
    }
    pub fn toasts(mut self, values: impl IntoIterator<Item = Toast>) -> Self {
        self.toasts = values.into_iter().collect();
        self
    }
    pub fn on_action(
        mut self,
        f: impl Fn(WorkspaceAction, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_action = Some(Rc::new(f));
        self
    }
}
impl RenderOnce for ToastStack {
    fn render(self, _: &mut Window, _: &mut App) -> impl IntoElement {
        div()
            .id(self.id)
            .role(gpui::Role::Log)
            .aria_label("Notifications")
            .flex()
            .flex_col()
            .gap(px(self.theme.space.sm))
            .children(self.toasts.into_iter().map(|toast| {
                let id = toast.id.clone();
                let click_id = id.clone();
                let key_id = id.clone();
                let click = self.on_action.clone();
                let key = self.on_action.clone();
                let accessible = self.on_action.clone();
                let accent = match toast.tone {
                    ToastTone::Info => self.theme.colors.info,
                    ToastTone::Success => self.theme.colors.success,
                    ToastTone::Warning => self.theme.colors.warning,
                    ToastTone::Danger => self.theme.colors.danger,
                };
                surface(self.theme)
                    .id(id.clone())
                    .role(gpui::Role::Status)
                    .border_1()
                    .border_l_4()
                    .border_color(accent)
                    .p(px(self.theme.space.md))
                    .child(toast.message)
                    .child(
                        div()
                            .id(format!("dismiss-toast-{id}"))
                            .role(gpui::Role::Button)
                            .aria_label("Dismiss Notification")
                            .focusable()
                            .tab_index(0)
                            .cursor_pointer()
                            .on_click(move |_, w, cx| {
                                if let Some(f) = &click {
                                    f(WorkspaceAction::DismissToast(click_id.clone()), w, cx);
                                }
                            })
                            .on_key_down(move |event, w, cx| {
                                if matches!(event.keystroke.key.as_str(), "enter" | "space")
                                    && let Some(f) = &key
                                {
                                    f(WorkspaceAction::DismissToast(key_id.clone()), w, cx);
                                }
                            })
                            .on_a11y_action(AccessibleAction::Click, move |_, w, cx| {
                                if let Some(f) = &accessible {
                                    f(WorkspaceAction::DismissToast(toast.id.clone()), w, cx);
                                }
                            })
                            .child("Dismiss"),
                    )
            }))
    }
}

#[derive(IntoElement)]
pub struct WorkspaceShell {
    id: ElementId,
    title: SharedString,
    theme: AuroraTheme,
    activity: Option<AnyElement>,
    left_panel: Option<AnyElement>,
    pane_tree: Option<AnyElement>,
    right_panel: Option<AnyElement>,
    bottom_panel: Option<AnyElement>,
    palette: Option<AnyElement>,
    notifications: Option<AnyElement>,
    progress: Option<AnyElement>,
}
impl WorkspaceShell {
    pub fn new(id: impl Into<ElementId>, title: impl Into<SharedString>) -> Self {
        Self {
            id: id.into(),
            title: title.into(),
            theme: AuroraTheme::default(),
            activity: None,
            left_panel: None,
            pane_tree: None,
            right_panel: None,
            bottom_panel: None,
            palette: None,
            notifications: None,
            progress: None,
        }
    }
    pub const fn theme(mut self, theme: AuroraTheme) -> Self {
        self.theme = theme;
        self
    }
    pub fn activity(mut self, value: impl IntoElement) -> Self {
        self.activity = Some(value.into_any_element());
        self
    }
    pub fn left_panel(mut self, value: impl IntoElement) -> Self {
        self.left_panel = Some(value.into_any_element());
        self
    }
    /// Supplies the host-rendered split pane tree; editor and agent views are ordinary slots within it.
    pub fn pane_tree(mut self, value: impl IntoElement) -> Self {
        self.pane_tree = Some(value.into_any_element());
        self
    }
    pub fn right_panel(mut self, value: impl IntoElement) -> Self {
        self.right_panel = Some(value.into_any_element());
        self
    }
    pub fn bottom_panel(mut self, value: impl IntoElement) -> Self {
        self.bottom_panel = Some(value.into_any_element());
        self
    }
    pub fn palette(mut self, value: impl IntoElement) -> Self {
        self.palette = Some(value.into_any_element());
        self
    }
    pub fn notifications(mut self, value: impl IntoElement) -> Self {
        self.notifications = Some(value.into_any_element());
        self
    }
    pub fn progress(mut self, value: impl IntoElement) -> Self {
        self.progress = Some(value.into_any_element());
        self
    }
}
impl RenderOnce for WorkspaceShell {
    fn render(self, _: &mut Window, _: &mut App) -> impl IntoElement {
        div()
            .id(self.id)
            .role(gpui::Role::Application)
            .aria_label(self.title.clone())
            .size_full()
            .bg(gpui::Hsla::from(self.theme.colors.background))
            .text_color(self.theme.colors.text)
            .flex()
            .flex_col()
            .child(TitleBar::new("workspace-title", self.title).theme(self.theme))
            .child(
                div()
                    .flex_1()
                    .flex()
                    .children(self.activity)
                    .children(self.left_panel)
                    .child(div().flex_1().children(self.pane_tree))
                    .children(self.right_panel),
            )
            .children(self.bottom_panel)
            .child(
                div()
                    .absolute()
                    .top_0()
                    .right_0()
                    .children(self.palette)
                    .children(self.notifications),
            )
            .children(self.progress)
            .child(StatusBar::new("workspace-status").theme(self.theme))
    }
}

macro_rules! impl_theme_builder {
    ($($component:ty),+ $(,)?) => {$(
        impl $component {
            /// Overrides the semantic Aurora theme used by this surface.
            pub const fn theme(mut self, theme: AuroraTheme) -> Self {
                self.theme = theme;
                self
            }
        }
    )+};
}

impl_theme_builder!(
    NavigationBar,
    Outline,
    ProgressIndicator,
    ActivityBar,
    BreadcrumbBar,
    ProjectTree,
    PaneTabs,
    DockPanel,
    CommandPalette,
    ToastStack,
);

#[cfg(test)]
mod tests {
    #![allow(clippy::float_cmp)]
    use super::*;

    fn pane() -> PaneState {
        let mut pane = PaneState::new("main");
        pane.tabs = vec![ItemTab::new("a", "A"), ItemTab::new("b", "B")];
        pane.active = Some("a".into());
        pane
    }

    #[test]
    fn resizing_clamps_and_collapsing_is_immutable() {
        let panel = PanelState::new("project", DockPosition::Left, 240.);
        assert_eq!(panel.resized(-999.).size, 120.);
        assert_eq!(panel.resized(999.).size, 720.);
        assert!(panel.toggled().collapsed);
        assert!(!panel.collapsed);
    }
    #[test]
    fn split_ratio_is_kept_usable() {
        let split = PaneNode::split(
            SplitAxis::Horizontal,
            1.0,
            PaneNode::Pane(pane()),
            PaneNode::Pane(PaneState::new("two")),
        );
        assert!(matches!(split, PaneNode::Split { ratio, .. } if ratio == 0.9));
    }
    #[test]
    fn tabs_select_and_wrap() {
        let pane = pane();
        assert_eq!(pane.adjacent(-1).as_deref(), Some("b"));
        assert_eq!(pane.select("b").unwrap().active.as_deref(), Some("b"));
        assert!(pane.select("missing").is_none());
    }
    #[test]
    fn layout_reducer_updates_only_target_panel() {
        let panel = PanelState::new("project", DockPosition::Left, 240.);
        let layout = WorkspaceLayout {
            version: 1,
            panels: BTreeMap::from([("project".into(), panel)]),
            root: PaneNode::Pane(pane()),
            focused_pane: None,
        };
        let next = layout.panel_action(&WorkspaceAction::ResizePanel {
            id: "project".into(),
            delta: 20.0,
        });
        assert_eq!(next.panels["project"].size, 260.);
        assert_eq!(layout.panels["project"].size, 240.);
    }
    #[test]
    fn palette_searches_label_and_detail_case_insensitively() {
        let items = [
            PaletteItem {
                id: "1".into(),
                label: "Open File".into(),
                detail: None,
            },
            PaletteItem {
                id: "2".into(),
                label: "Theme".into(),
                detail: Some("Open Settings".into()),
            },
        ];
        assert_eq!(filter_palette(&items, "OPEN").len(), 2);
    }
    #[test]
    fn key_map_is_context_sensitive() {
        let state = InteractionState {
            focused_tree_entry: Some("src/main.rs".into()),
            selected_palette_item: Some("open-file".into()),
            focused_tab: Some(("main".into(), "readme".into())),
            ..InteractionState::default()
        };
        assert_eq!(
            keyboard_action("p", true, false, WorkspaceKeyContext::Global, &state),
            Some(WorkspaceAction::OpenPalette)
        );
        assert_eq!(
            keyboard_action("enter", false, false, WorkspaceKeyContext::Pane, &state),
            None
        );
        assert!(matches!(
            keyboard_action("enter", false, false, WorkspaceKeyContext::ProjectTree, &state),
            Some(WorkspaceAction::OpenProjectEntry(ref id)) if id.as_ref() == "src/main.rs"
        ));
        assert!(
            matches!(keyboard_action("enter", false, false, WorkspaceKeyContext::Palette, &state), Some(WorkspaceAction::SelectPaletteResult(ref id)) if id.as_ref() == "open-file")
        );
    }
    #[test]
    fn persistence_contract_round_trips() {
        struct Memory(Option<WorkspaceLayout>);
        impl LayoutStore for Memory {
            type Error = ();
            fn load(&self, _: &str) -> Result<Option<WorkspaceLayout>, ()> {
                Ok(self.0.clone())
            }
            fn save(&mut self, _: &str, layout: &WorkspaceLayout) -> Result<(), ()> {
                self.0 = Some(layout.clone());
                Ok(())
            }
        }
        let layout = WorkspaceLayout {
            version: WorkspaceLayout::CURRENT_VERSION,
            panels: BTreeMap::new(),
            root: PaneNode::Pane(pane()),
            focused_pane: None,
        };
        let mut store = Memory(None);
        store.save("w", &layout).unwrap();
        assert_eq!(store.load("w").unwrap(), Some(layout));
    }

    #[test]
    fn validation_rejects_bad_versions_and_panel_numbers() {
        let mut panel = PanelState::new("bad", DockPosition::Left, 240.0);
        panel.size = f32::NAN;
        assert!(matches!(
            panel.validate(),
            Err(LayoutValidationError::NonFinitePanelSize(_))
        ));
        let layout = WorkspaceLayout {
            version: 99,
            panels: BTreeMap::new(),
            root: PaneNode::Pane(pane()),
            focused_pane: None,
        };
        assert_eq!(
            layout.validate(),
            Err(LayoutValidationError::UnsupportedVersion(99))
        );
    }

    #[test]
    fn layout_validation_enforces_stable_identity_references() {
        let mut layout = WorkspaceLayout {
            version: WorkspaceLayout::CURRENT_VERSION,
            panels: BTreeMap::from([(
                "map-key".into(),
                PanelState::new("different-id", DockPosition::Left, 240.0),
            )]),
            root: PaneNode::Pane(pane()),
            focused_pane: None,
        };
        assert!(matches!(
            layout.validate(),
            Err(LayoutValidationError::PanelKeyMismatch { .. })
        ));

        layout.panels.clear();
        layout.focused_pane = Some("missing".into());
        assert!(matches!(
            layout.validate(),
            Err(LayoutValidationError::FocusedPaneMissing(_))
        ));

        let mut invalid_active = pane();
        invalid_active.active = Some("missing".into());
        layout.focused_pane = None;
        layout.root = PaneNode::Pane(invalid_active);
        assert!(matches!(
            layout.validate(),
            Err(LayoutValidationError::ActiveItemMissing { .. })
        ));
    }

    #[test]
    fn repeated_splits_generate_unique_valid_pane_ids() {
        let layout = WorkspaceLayout {
            version: WorkspaceLayout::CURRENT_VERSION,
            panels: BTreeMap::new(),
            root: PaneNode::Pane(pane()),
            focused_pane: Some("main".into()),
        };
        let once = layout.reduced(&WorkspaceAction::SplitPane {
            pane: "main".into(),
            axis: SplitAxis::Vertical,
        });
        let twice = once.reduced(&WorkspaceAction::SplitPane {
            pane: "main".into(),
            axis: SplitAxis::Horizontal,
        });
        assert!(twice.validate().is_ok());
        let mut ids = BTreeSet::new();
        twice.root.pane_ids(&mut ids);
        assert_eq!(ids.len(), 3);
        assert!(ids.contains("main-split-1"));
        assert!(ids.contains("main-split-2"));
    }

    #[test]
    fn controller_validates_restores_reduces_and_saves() {
        #[derive(Default)]
        struct Memory {
            value: Option<WorkspaceLayout>,
            saves: usize,
        }
        impl LayoutStore for Memory {
            type Error = ();
            fn load(&self, _: &str) -> Result<Option<WorkspaceLayout>, ()> {
                Ok(self.value.clone())
            }
            fn save(&mut self, _: &str, layout: &WorkspaceLayout) -> Result<(), ()> {
                self.value = Some(layout.clone());
                self.saves += 1;
                Ok(())
            }
        }
        let layout = WorkspaceLayout {
            version: 1,
            panels: BTreeMap::from([(
                "project".into(),
                PanelState::new("project", DockPosition::Left, 240.0),
            )]),
            root: PaneNode::Pane(pane()),
            focused_pane: None,
        };
        let mut controller =
            WorkspaceController::restore("workspace", Memory::default(), layout).unwrap();
        controller
            .dispatch(&WorkspaceAction::TogglePanel("project".into()))
            .unwrap();
        assert!(controller.layout().panels["project"].collapsed);
        controller
            .dispatch(&WorkspaceAction::FocusPane("main".into()))
            .unwrap();
        controller
            .dispatch(&WorkspaceAction::SelectItem {
                pane: "main".into(),
                item: "b".into(),
            })
            .unwrap();
        assert!(matches!(
            &controller.layout().root,
            PaneNode::Pane(pane) if pane.active.as_deref() == Some("b")
        ));
        controller
            .dispatch(&WorkspaceAction::CloseItem {
                pane: "main".into(),
                item: "b".into(),
            })
            .unwrap();
        assert!(matches!(
            &controller.layout().root,
            PaneNode::Pane(pane) if pane.active.as_deref() == Some("a") && pane.tabs.len() == 1
        ));
        controller
            .dispatch(&WorkspaceAction::SplitPane {
                pane: "main".into(),
                axis: SplitAxis::Vertical,
            })
            .unwrap();
        assert!(matches!(
            &controller.layout().root,
            PaneNode::Split {
                axis: SplitAxis::Vertical,
                ..
            }
        ));
        assert_eq!(controller.into_store().saves, 5);
    }

    #[test]
    fn controller_does_not_persist_actions_that_do_not_change_layout() {
        #[derive(Default)]
        struct Memory(usize);
        impl LayoutStore for Memory {
            type Error = ();
            fn load(&self, _: &str) -> Result<Option<WorkspaceLayout>, ()> {
                Ok(None)
            }
            fn save(&mut self, _: &str, _: &WorkspaceLayout) -> Result<(), ()> {
                self.0 += 1;
                Ok(())
            }
        }
        let layout = WorkspaceLayout {
            version: 1,
            panels: BTreeMap::new(),
            root: PaneNode::Pane(pane()),
            focused_pane: None,
        };
        let mut controller = WorkspaceController::restore("workspace", Memory::default(), layout)
            .expect("restore fallback");
        controller
            .dispatch(&WorkspaceAction::NavigateBack)
            .expect("no-op action");
        controller
            .dispatch(&WorkspaceAction::FocusPane("missing".into()))
            .expect("unknown pane is ignored");
        assert_eq!(controller.into_store().0, 0);
    }

    #[test]
    fn breadcrumbs_use_stable_identity_in_actions() {
        let state = InteractionState {
            focused_breadcrumb: Some("src/main.rs".into()),
            ..InteractionState::default()
        };
        assert!(matches!(
            keyboard_action("space", false, false, WorkspaceKeyContext::Global, &state),
            Some(WorkspaceAction::OpenBreadcrumb(ref id)) if id.as_ref() == "src/main.rs"
        ));
    }

    #[test]
    fn palette_selection_is_always_in_bounds() {
        assert_eq!(clamp_selection(8, 3), Some(2));
        assert_eq!(clamp_selection(0, 0), None);
    }
}
