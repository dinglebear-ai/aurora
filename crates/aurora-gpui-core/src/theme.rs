#![allow(clippy::unreadable_literal)]

use crate::Color;

/// Density applied to interactive controls and data-heavy surfaces.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum Density {
    Compact,
    #[default]
    Comfortable,
    Spacious,
}

/// Semantic color roles shared by every Aurora GPUI component.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct ColorTokens {
    pub background: Color,
    pub surface: Color,
    pub surface_hover: Color,
    pub surface_active: Color,
    pub border: Color,
    pub border_focused: Color,
    pub text: Color,
    pub text_muted: Color,
    pub primary: Color,
    pub secondary: Color,
    pub automation: Color,
    pub success: Color,
    pub warning: Color,
    pub danger: Color,
    pub info: Color,
}

/// Spacing scale in logical pixels.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct SpaceTokens {
    pub xxs: f32,
    pub xs: f32,
    pub sm: f32,
    pub md: f32,
    pub lg: f32,
    pub xl: f32,
    pub xxl: f32,
}

/// Corner-radius scale in logical pixels.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct RadiusTokens {
    pub sm: f32,
    pub md: f32,
    pub lg: f32,
    pub pill: f32,
}

/// Complete Aurora theme data required by platform components.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct AuroraTheme {
    pub colors: ColorTokens,
    pub space: SpaceTokens,
    pub radii: RadiusTokens,
    pub density: Density,
}

impl AuroraTheme {
    /// Aurora's canonical dark-first theme.
    #[must_use]
    pub const fn dark() -> Self {
        Self {
            colors: ColorTokens {
                background: Color::hex(0x07131c),
                surface: Color::hex(0x0d1d29),
                surface_hover: Color::hex(0x132938),
                surface_active: Color::hex(0x193547),
                border: Color::hex(0x294555),
                border_focused: Color::hex(0x22d3ee),
                text: Color::hex(0xe8f3f8),
                text_muted: Color::hex(0x91a9b7),
                primary: Color::hex(0x22d3ee),
                secondary: Color::hex(0xfb7185),
                automation: Color::hex(0xf97316),
                success: Color::hex(0x34d399),
                warning: Color::hex(0xfbbf24),
                danger: Color::hex(0xf43f5e),
                info: Color::hex(0x38bdf8),
            },
            space: SpaceTokens {
                xxs: 2.0,
                xs: 4.0,
                sm: 8.0,
                md: 12.0,
                lg: 16.0,
                xl: 24.0,
                xxl: 32.0,
            },
            radii: RadiusTokens {
                sm: 4.0,
                md: 6.0,
                lg: 10.0,
                pill: 999.0,
            },
            density: Density::Comfortable,
        }
    }
}

impl Default for AuroraTheme {
    fn default() -> Self {
        Self::dark()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn dark_theme_uses_the_canonical_navy_base() {
        assert_eq!(
            AuroraTheme::dark().colors.background.rgba(),
            [7, 19, 28, 255]
        );
    }

    #[test]
    fn semantic_accents_remain_distinct() {
        let colors = AuroraTheme::dark().colors;
        assert_ne!(colors.primary, colors.secondary);
        assert_ne!(colors.primary, colors.automation);
        assert_ne!(colors.secondary, colors.automation);
    }
}
