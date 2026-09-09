use aurora_gpui_core::AuroraTheme;
use gpui::{IntoElement, RenderOnce, SharedString, div, prelude::*, px, rems};

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum BadgeTone {
    #[default]
    Neutral,
    Primary,
    Success,
    Warning,
    Danger,
    Automation,
}

#[derive(IntoElement)]
pub struct Badge {
    text: SharedString,
    tone: BadgeTone,
    theme: AuroraTheme,
}

impl Badge {
    pub fn new(text: impl Into<SharedString>) -> Self {
        Self {
            text: text.into(),
            tone: BadgeTone::default(),
            theme: AuroraTheme::default(),
        }
    }

    #[must_use]
    pub const fn tone(mut self, tone: BadgeTone) -> Self {
        self.tone = tone;
        self
    }

    #[must_use]
    pub const fn theme(mut self, theme: AuroraTheme) -> Self {
        self.theme = theme;
        self
    }
}

impl RenderOnce for Badge {
    fn render(self, _window: &mut gpui::Window, _cx: &mut gpui::App) -> impl IntoElement {
        let accent = match self.tone {
            BadgeTone::Neutral => self.theme.colors.text_muted,
            BadgeTone::Primary => self.theme.colors.primary,
            BadgeTone::Success => self.theme.colors.success,
            BadgeTone::Warning => self.theme.colors.warning,
            BadgeTone::Danger => self.theme.colors.danger,
            BadgeTone::Automation => self.theme.colors.automation,
        };
        let accent: gpui::Hsla = accent.into();

        div()
            .id(self.text.clone())
            .role(gpui::Role::Label)
            .aria_label(self.text.clone())
            .flex()
            .items_center()
            .px(px(self.theme.space.sm))
            .h(px(22.0))
            .rounded(px(self.theme.radii.pill))
            .border_1()
            .border_color(accent.alpha(0.45))
            .bg(accent.alpha(0.12))
            .text_size(rems(0.6875))
            .text_color(accent)
            .child(self.text)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn supports_status_and_automation_tones() {
        assert_ne!(BadgeTone::Success, BadgeTone::Danger);
        assert_ne!(BadgeTone::Primary, BadgeTone::Automation);
    }
}
