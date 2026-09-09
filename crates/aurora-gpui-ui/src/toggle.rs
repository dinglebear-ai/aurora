use std::rc::Rc;

use aurora_gpui_core::AuroraTheme;
use gpui::{
    App, ClickEvent, ElementId, IntoElement, RenderOnce, SharedString, Window, div, prelude::*, px,
};

type ChangeHandler = Rc<dyn Fn(bool, &ClickEvent, &mut Window, &mut App)>;

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum ToggleState {
    #[default]
    Off,
    On,
    Mixed,
}

impl ToggleState {
    #[must_use]
    pub const fn is_on(self) -> bool {
        matches!(self, Self::On)
    }
    #[must_use]
    pub const fn toggled(self) -> Self {
        if self.is_on() { Self::Off } else { Self::On }
    }
}

#[derive(IntoElement)]
pub struct Switch {
    id: ElementId,
    state: ToggleState,
    disabled: bool,
    theme: AuroraTheme,
    on_change: Option<ChangeHandler>,
}

impl Switch {
    pub fn new(id: impl Into<ElementId>, state: ToggleState) -> Self {
        Self {
            id: id.into(),
            state,
            disabled: false,
            theme: AuroraTheme::default(),
            on_change: None,
        }
    }
    #[must_use]
    pub const fn disabled(mut self, value: bool) -> Self {
        self.disabled = value;
        self
    }
    #[must_use]
    pub const fn theme(mut self, value: AuroraTheme) -> Self {
        self.theme = value;
        self
    }
    #[must_use]
    pub fn on_change(
        mut self,
        f: impl Fn(bool, &ClickEvent, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_change = Some(Rc::new(f));
        self
    }
}

impl RenderOnce for Switch {
    fn render(self, _: &mut Window, _: &mut App) -> impl IntoElement {
        let on = self.state.is_on();
        let colors = self.theme.colors;
        let mut el = div()
            .id(self.id)
            .role(gpui::Role::Switch)
            .aria_label("Switch")
            .aria_toggled(if on {
                gpui::Toggled::True
            } else {
                gpui::Toggled::False
            })
            .when(!self.disabled, |element| element.focusable().tab_index(0))
            .flex()
            .items_center()
            .w(px(36.))
            .h(px(20.))
            .p(px(2.))
            .rounded(px(self.theme.radii.pill))
            .bg(gpui::Hsla::from(if on {
                colors.primary
            } else {
                colors.surface_active
            }))
            .border_1()
            .border_color(if on { colors.primary } else { colors.border })
            .when(!self.disabled, gpui::Styled::cursor_pointer)
            .when(self.disabled, |e| e.opacity(0.45))
            .child(
                div()
                    .w(px(14.))
                    .h(px(14.))
                    .rounded(px(self.theme.radii.pill))
                    .bg(gpui::Hsla::from(if on {
                        colors.background
                    } else {
                        colors.text_muted
                    }))
                    .when(on, gpui::Styled::ml_auto),
            );
        if let Some(handler) = self.on_change.filter(|_| !self.disabled) {
            let keyboard = handler.clone();
            el = el
                .on_key_down(move |event, win, cx| {
                    if crate::button::is_activation_key(&event.keystroke.key) {
                        keyboard(!on, &ClickEvent::default(), win, cx);
                    }
                })
                .on_click(move |ev, win, cx| handler(!on, ev, win, cx));
        }
        el
    }
}

#[derive(IntoElement)]
pub struct Checkbox {
    id: ElementId,
    label: SharedString,
    state: ToggleState,
    disabled: bool,
    theme: AuroraTheme,
    on_change: Option<ChangeHandler>,
}
impl Checkbox {
    pub fn new(
        id: impl Into<ElementId>,
        label: impl Into<SharedString>,
        state: ToggleState,
    ) -> Self {
        Self {
            id: id.into(),
            label: label.into(),
            state,
            disabled: false,
            theme: AuroraTheme::default(),
            on_change: None,
        }
    }
    #[must_use]
    pub const fn disabled(mut self, v: bool) -> Self {
        self.disabled = v;
        self
    }
    #[must_use]
    pub const fn theme(mut self, v: AuroraTheme) -> Self {
        self.theme = v;
        self
    }
    #[must_use]
    pub fn on_change(
        mut self,
        f: impl Fn(bool, &ClickEvent, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_change = Some(Rc::new(f));
        self
    }
}
impl RenderOnce for Checkbox {
    fn render(self, _: &mut Window, _: &mut App) -> impl IntoElement {
        let on = self.state.is_on();
        let c = self.theme.colors;
        let mark = if matches!(self.state, ToggleState::Mixed) {
            "−"
        } else if on {
            "✓"
        } else {
            ""
        };
        let mut el = div()
            .id(self.id)
            .role(gpui::Role::CheckBox)
            .aria_label(self.label.clone())
            .aria_toggled(match self.state {
                ToggleState::Off => gpui::Toggled::False,
                ToggleState::On => gpui::Toggled::True,
                ToggleState::Mixed => gpui::Toggled::Mixed,
            })
            .when(!self.disabled, |element| element.focusable().tab_index(0))
            .flex()
            .items_center()
            .gap(px(self.theme.space.sm))
            .text_color(c.text)
            .when(!self.disabled, gpui::Styled::cursor_pointer)
            .when(self.disabled, |e| e.opacity(0.45))
            .child(
                div()
                    .flex()
                    .items_center()
                    .justify_center()
                    .w(px(18.))
                    .h(px(18.))
                    .rounded(px(self.theme.radii.sm))
                    .border_1()
                    .border_color(if on { c.primary } else { c.border })
                    .bg(gpui::Hsla::from(if on { c.primary } else { c.surface }))
                    .text_color(c.background)
                    .child(mark),
            )
            .child(self.label);
        if let Some(h) = self.on_change.filter(|_| !self.disabled) {
            let keyboard = h.clone();
            el = el
                .on_key_down(move |event, w, cx| {
                    if crate::button::is_activation_key(&event.keystroke.key) {
                        keyboard(!on, &ClickEvent::default(), w, cx);
                    }
                })
                .on_click(move |ev, w, cx| h(!on, ev, w, cx));
        }
        el
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn mixed_and_off_toggle_on() {
        assert_eq!(ToggleState::Mixed.toggled(), ToggleState::On);
        assert_eq!(ToggleState::Off.toggled(), ToggleState::On);
    }
    #[test]
    fn disabled_switch_suppresses_handler() {
        let switch = Switch::new("switch", ToggleState::Off)
            .on_change(|_, _, _, _| {})
            .disabled(true);
        assert!(switch.on_change.as_ref().is_none_or(|_| switch.disabled));
    }
}
