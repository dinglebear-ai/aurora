//! Shared design-system foundations for Aurora GPUI components.
//!
//! This crate owns Aurora's stable semantic vocabulary. Components consume
//! semantic roles such as [`ColorTokens::surface`] instead of embedding palette
//! values or depending on an application's theme model.

mod color;
mod theme;

pub use color::Color;
pub use theme::{AuroraTheme, ColorTokens, Density, RadiusTokens, SpaceTokens};
