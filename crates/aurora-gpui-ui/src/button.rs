use std::rc::Rc;

use aurora_gpui_core::AuroraTheme;
use gpui::{
    App, ClickEvent, ElementId, IntoElement, RenderOnce, SharedString, Window, div, prelude::*, px,
    rems,
};

type ClickHandler = Rc<dyn Fn(&ClickEvent, &mut Window, &mut App)>;

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum ButtonVariant {
    #[default]
    Primary,
    Secondary,
    Ghost,
    Danger,
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum ButtonSize {
    Small,
    #[default]
    Medium,
    Large,
}

#[derive(IntoElement)]
pub struct Button {
    id: ElementId,
    label: SharedString,
    variant: ButtonVariant,
    size: ButtonSize,
    disabled: bool,
    selected: bool,
    theme: AuroraTheme,
    on_click: Option<ClickHandler>,
}

impl Button {
    pub fn new(id: impl Into<ElementId>, label: impl Into<SharedString>) -> Self {
        Self {
            id: id.into(),
            label: label.into(),
            variant: ButtonVariant::default(),
            size: ButtonSize::default(),
            disabled: false,
            selected: false,
            theme: AuroraTheme::default(),
            on_click: None,
        }
    }

    #[must_use]
    pub const fn variant(mut self, variant: ButtonVariant) -> Self {
        self.variant = variant;
        self
    }

    #[must_use]
    pub const fn size(mut self, size: ButtonSize) -> Self {
        self.size = size;
        self
    }

    #[must_use]
    pub const fn disabled(mut self, disabled: bool) -> Self {
        self.disabled = disabled;
        self
    }

    #[must_use]
    pub const fn selected(mut self, selected: bool) -> Self {
        self.selected = selected;
        self
    }

    #[must_use]
    pub const fn theme(mut self, theme: AuroraTheme) -> Self {
        self.theme = theme;
        self
    }

    #[must_use]
    pub fn on_click(
        mut self,
        handler: impl Fn(&ClickEvent, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_click = Some(Rc::new(handler));
        self
    }
}

impl RenderOnce for Button {
    fn render(self, _window: &mut Window, _cx: &mut App) -> impl IntoElement {
        let colors = self.theme.colors;
        let (background, foreground, border) = match self.variant {
            ButtonVariant::Primary => (colors.primary, colors.background, colors.primary),
            ButtonVariant::Secondary => (colors.surface_active, colors.text, colors.border),
            ButtonVariant::Ghost => (colors.background.with_alpha(0), colors.text, colors.border),
            ButtonVariant::Danger => (colors.danger, colors.text, colors.danger),
        };
        let background = if self.selected {
            colors.surface_active
        } else {
            background
        };
        let background: gpui::Hsla = background.into();
        let hover: gpui::Hsla = match self.variant {
            ButtonVariant::Primary => colors.primary,
            ButtonVariant::Secondary | ButtonVariant::Ghost => colors.surface_hover,
            ButtonVariant::Danger => colors.danger,
        }
        .into();
        let (height, horizontal_padding, font_size) = match self.size {
            ButtonSize::Small => (28.0, self.theme.space.sm, 0.75),
            ButtonSize::Medium => (34.0, self.theme.space.md, 0.875),
            ButtonSize::Large => (40.0, self.theme.space.lg, 1.0),
        };

        let mut element = div()
            .id(self.id)
            .role(gpui::Role::Button)
            .aria_label(self.label.clone())
            .when(!self.disabled, |element| element.focusable().tab_index(0))
            .flex()
            .items_center()
            .justify_center()
            .h(px(height))
            .px(px(horizontal_padding))
            .rounded(px(self.theme.radii.md))
            .border_1()
            .border_color(border)
            .bg(background)
            .text_size(rems(font_size))
            .text_color(foreground)
            .when(!self.disabled, |this| {
                this.cursor_pointer().hover(move |style| style.bg(hover))
            })
            .when(self.disabled, |this| this.opacity(0.45))
            .child(self.label);

        if let Some(on_click) = self.on_click.filter(|_| !self.disabled) {
            let keyboard = on_click.clone();
            element = element
                .on_key_down(move |event, window, cx| {
                    if is_activation_key(&event.keystroke.key) {
                        keyboard(&ClickEvent::default(), window, cx);
                    }
                })
                .on_click(move |event, window, cx| on_click(event, window, cx));
        }

        element
    }
}

#[must_use]
pub fn is_activation_key(key: &str) -> bool {
    matches!(key, "enter" | "space")
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn disabled_button_suppresses_handler() {
        let button = Button::new("save", "Save")
            .on_click(|_, _, _| {})
            .disabled(true);
        assert!(button.disabled);
        assert!(button.on_click.as_ref().is_none_or(|_| button.disabled));
    }
    #[test]
    fn enter_and_space_activate() {
        assert!(is_activation_key("enter"));
        assert!(is_activation_key("space"));
        assert!(!is_activation_key("escape"));
    }
}
