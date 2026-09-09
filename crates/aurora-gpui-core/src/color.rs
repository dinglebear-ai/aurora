#![allow(clippy::unreadable_literal)]

use gpui::{Hsla, rgba};

/// An sRGB color with an explicit alpha channel.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Color {
    red: u8,
    green: u8,
    blue: u8,
    alpha: u8,
}

impl Color {
    /// Creates an opaque color from a six-digit hexadecimal value.
    #[must_use]
    pub const fn hex(value: u32) -> Self {
        Self {
            red: ((value >> 16) & 0xff) as u8,
            green: ((value >> 8) & 0xff) as u8,
            blue: (value & 0xff) as u8,
            alpha: u8::MAX,
        }
    }

    /// Returns this color with a new alpha channel.
    #[must_use]
    pub const fn with_alpha(self, alpha: u8) -> Self {
        Self { alpha, ..self }
    }

    /// Returns the red, green, blue, and alpha channels.
    #[must_use]
    pub const fn rgba(self) -> [u8; 4] {
        [self.red, self.green, self.blue, self.alpha]
    }
}

impl From<Color> for Hsla {
    fn from(color: Color) -> Self {
        rgba(u32::from_be_bytes(color.rgba())).into()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_hex_channels() {
        assert_eq!(Color::hex(0x07131c).rgba(), [7, 19, 28, 255]);
    }

    #[test]
    fn preserves_alpha_when_converting_to_gpui() {
        let converted = Hsla::from(Color::hex(0xffffff).with_alpha(128));
        assert!((converted.a - 128.0 / 255.0).abs() < f32::EPSILON);
    }
}
