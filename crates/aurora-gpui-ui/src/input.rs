use aurora_gpui_core::AuroraTheme;
use gpui::{
    App, ElementId, IntoElement, KeyDownEvent, RenderOnce, SharedString, Window, div, prelude::*,
    px, rems,
};
use std::rc::Rc;

type ChangeHandler = Rc<dyn Fn(SharedString, &mut Window, &mut App)>;
type SubmitHandler = Rc<dyn Fn(&mut Window, &mut App)>;

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum InputSize {
    Small,
    #[default]
    Medium,
    Large,
}
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct InputState {
    pub value: SharedString,
    pub focused: bool,
    pub disabled: bool,
    pub invalid: bool,
}
impl InputState {
    #[must_use]
    pub fn display_text<'a>(&'a self, placeholder: &'a SharedString) -> &'a SharedString {
        if self.value.is_empty() {
            placeholder
        } else {
            &self.value
        }
    }
    #[must_use]
    pub fn apply_key(&self, event: &KeyDownEvent, multiline: bool) -> Option<SharedString> {
        if self.disabled {
            return None;
        }
        let mut next = self.value.to_string();
        match event.keystroke.key.as_str() {
            "backspace" => {
                next.pop()?;
            }
            "enter" if multiline => next.push('\n'),
            "enter" => return None,
            _ => {
                let modifiers = event.keystroke.modifiers;
                if modifiers.platform || modifiers.control || modifiers.alt || modifiers.function {
                    return None;
                }
                next.push_str(event.keystroke.key_char.as_deref()?);
            }
        }
        Some(next.into())
    }
    #[must_use]
    pub fn should_submit(&self, event: &KeyDownEvent, multiline: bool) -> bool {
        !self.disabled && !multiline && event.keystroke.key == "enter"
    }
}

#[derive(IntoElement)]
pub struct Input {
    id: ElementId,
    state: InputState,
    label: SharedString,
    placeholder: SharedString,
    size: InputSize,
    multiline: bool,
    theme: AuroraTheme,
    on_change: Option<ChangeHandler>,
    on_submit: Option<SubmitHandler>,
}
impl Input {
    pub fn new(id: impl Into<ElementId>) -> Self {
        Self {
            id: id.into(),
            state: InputState::default(),
            label: "Input".into(),
            placeholder: "".into(),
            size: InputSize::default(),
            multiline: false,
            theme: AuroraTheme::default(),
            on_change: None,
            on_submit: None,
        }
    }
    #[must_use]
    pub fn state(mut self, v: InputState) -> Self {
        self.state = v;
        self
    }
    #[must_use]
    pub fn label(mut self, v: impl Into<SharedString>) -> Self {
        self.label = v.into();
        self
    }
    #[must_use]
    pub fn placeholder(mut self, v: impl Into<SharedString>) -> Self {
        self.placeholder = v.into();
        self
    }
    #[must_use]
    pub const fn size(mut self, v: InputSize) -> Self {
        self.size = v;
        self
    }
    #[must_use]
    pub const fn multiline(mut self, v: bool) -> Self {
        self.multiline = v;
        self
    }
    #[must_use]
    pub const fn theme(mut self, v: AuroraTheme) -> Self {
        self.theme = v;
        self
    }
    #[must_use]
    pub fn on_change(mut self, f: impl Fn(SharedString, &mut Window, &mut App) + 'static) -> Self {
        self.on_change = Some(Rc::new(f));
        self
    }
    #[must_use]
    pub fn on_submit(mut self, f: impl Fn(&mut Window, &mut App) + 'static) -> Self {
        self.on_submit = Some(Rc::new(f));
        self
    }
}
impl RenderOnce for Input {
    fn render(self, _: &mut Window, _: &mut App) -> impl IntoElement {
        let c = self.theme.colors;
        let empty = self.state.value.is_empty();
        let h = match self.size {
            InputSize::Small => 30.,
            InputSize::Medium => 36.,
            InputSize::Large => 42.,
        };
        let state = self.state.clone();
        let multiline = self.multiline;
        let change = self.on_change.clone();
        let submit = self.on_submit.clone();
        div()
            .id(self.id)
            .role(gpui::Role::TextInput)
            .aria_label(self.label)
            .aria_value(self.state.value.clone())
            .aria_placeholder(self.placeholder.clone())
            .when(!self.state.disabled, |element| {
                element.focusable().tab_index(0)
            })
            .on_key_down(move |event, window, cx| {
                if state.should_submit(event, multiline) {
                    if let Some(f) = &submit {
                        f(window, cx);
                    }
                } else if let (Some(next), Some(f)) = (state.apply_key(event, multiline), &change) {
                    f(next, window, cx);
                }
            })
            .flex()
            .items_center()
            .min_h(px(if multiline { h * 2.5 } else { h }))
            .px(px(self.theme.space.md))
            .rounded(px(self.theme.radii.md))
            .border_1()
            .border_color(if self.state.invalid {
                c.danger
            } else if self.state.focused {
                c.border_focused
            } else {
                c.border
            })
            .bg(gpui::Hsla::from(c.surface))
            .text_size(rems(0.875))
            .text_color(if empty { c.text_muted } else { c.text })
            .when(self.state.disabled, |e| e.opacity(0.45))
            .child(self.state.display_text(&self.placeholder).clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn key_with_modifiers(key: &str, ch: Option<&str>, modifiers: gpui::Modifiers) -> KeyDownEvent {
        KeyDownEvent {
            keystroke: gpui::Keystroke {
                key: key.into(),
                key_char: ch.map(str::to_owned),
                modifiers,
            },
            is_held: false,
            prefer_character_input: false,
        }
    }
    fn key(key: &str, ch: Option<&str>) -> KeyDownEvent {
        key_with_modifiers(key, ch, gpui::Modifiers::default())
    }
    #[test]
    fn placeholder_only_when_empty() {
        let p: SharedString = "Prompt".into();
        let mut s = InputState::default();
        assert_eq!(s.display_text(&p), &p);
        s.value = "Text".into();
        assert_eq!(s.display_text(&p), &s.value);
    }
    #[test]
    fn editing_honors_disabled() {
        let s = InputState::default();
        assert_eq!(
            s.apply_key(&key("a", Some("a")), false).as_deref(),
            Some("a")
        );
        let s = InputState {
            value: "ab".into(),
            ..Default::default()
        };
        assert_eq!(
            s.apply_key(&key("backspace", None), false).as_deref(),
            Some("a")
        );
        let s = InputState {
            disabled: true,
            ..s
        };
        assert!(s.apply_key(&key("a", Some("a")), false).is_none());
    }
    #[test]
    fn disabled_input_suppresses_submit() {
        let event = key("enter", None);
        assert!(InputState::default().should_submit(&event, false));
        assert!(
            !InputState {
                disabled: true,
                ..Default::default()
            }
            .should_submit(&event, false)
        );
    }
    #[test]
    fn text_insertion_rejects_command_control_alt_and_function_modifiers() {
        for modifiers in [
            gpui::Modifiers {
                platform: true,
                ..Default::default()
            },
            gpui::Modifiers {
                control: true,
                ..Default::default()
            },
            gpui::Modifiers {
                alt: true,
                ..Default::default()
            },
            gpui::Modifiers {
                function: true,
                ..Default::default()
            },
        ] {
            assert!(
                InputState::default()
                    .apply_key(&key_with_modifiers("k", Some("k"), modifiers), false)
                    .is_none()
            );
        }

        assert_eq!(
            InputState::default()
                .apply_key(
                    &key_with_modifiers(
                        "k",
                        Some("K"),
                        gpui::Modifiers {
                            shift: true,
                            ..Default::default()
                        },
                    ),
                    false,
                )
                .as_deref(),
            Some("K")
        );
    }
}
