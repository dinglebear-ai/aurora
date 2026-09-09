use aurora_gpui_core::AuroraTheme;
use gpui::{IntoElement, RenderOnce, SharedString, div, prelude::*, rems};

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum LabelSize {
    Small,
    #[default]
    Medium,
    Large,
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum LabelTone {
    #[default]
    Default,
    Muted,
    Primary,
    Danger,
}

#[derive(IntoElement)]
pub struct Label {
    text: SharedString,
    size: LabelSize,
    tone: LabelTone,
    theme: AuroraTheme,
}

impl Label {
    pub fn new(text: impl Into<SharedString>) -> Self {
        Self {
            text: text.into(),
            size: LabelSize::default(),
            tone: LabelTone::default(),
            theme: AuroraTheme::default(),
        }
    }

    #[must_use]
    pub const fn size(mut self, size: LabelSize) -> Self {
        self.size = size;
        self
    }

    #[must_use]
    pub const fn tone(mut self, tone: LabelTone) -> Self {
        self.tone = tone;
        self
    }

    #[must_use]
    pub const fn theme(mut self, theme: AuroraTheme) -> Self {
        self.theme = theme;
        self
    }
}

impl RenderOnce for Label {
    fn render(self, _window: &mut gpui::Window, _cx: &mut gpui::App) -> impl IntoElement {
        let color = match self.tone {
            LabelTone::Default => self.theme.colors.text,
            LabelTone::Muted => self.theme.colors.text_muted,
            LabelTone::Primary => self.theme.colors.primary,
            LabelTone::Danger => self.theme.colors.danger,
        };
        let size = match self.size {
            LabelSize::Small => rems(0.75),
            LabelSize::Medium => rems(0.875),
            LabelSize::Large => rems(1.0),
        };

        div()
            .id(self.text.clone())
            .role(gpui::Role::Label)
            .aria_label(self.text.clone())
            .text_size(size)
            .text_color(color)
            .child(self.text)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn label_variants_are_distinct() {
        assert_ne!(LabelSize::Small, LabelSize::Large);
        assert_ne!(LabelTone::Muted, LabelTone::Danger);
    }
}
