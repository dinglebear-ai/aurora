//! Reusable, application-neutral Aurora components for GPUI.

mod badge;
mod button;
mod input;
mod label;
mod list;
mod menu;
mod overlay;
mod scrollbar;
mod table;
mod tabs;
mod toggle;

pub use badge::{Badge, BadgeTone};
pub use button::{Button, ButtonSize, ButtonVariant, is_activation_key};
pub use input::{Input, InputSize, InputState};
pub use label::{Label, LabelSize, LabelTone};
pub use list::{List, ListItem, next_enabled};
pub use menu::{Menu, MenuItem, next_menu_item};
pub use overlay::{Modal, OverlayPlacement, Popover};
pub use scrollbar::{
    ScrollDragOrigin, ScrollPointerDecision, Scrollbar, ScrollbarAxis, ScrollbarState,
};
pub use table::{Table, TableColumn, TableRow, TableValidationError, validate_rows};
pub use tabs::{Tab, TabList, adjacent_tab};
pub use toggle::{Checkbox, Switch, ToggleState};
