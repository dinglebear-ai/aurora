use aurora_gpui_ui::{
    Badge, BadgeTone, Button, Checkbox, Input, InputState, Label, List, ListItem, Menu, MenuItem,
    Modal, Popover, ScrollDragOrigin, Scrollbar, ScrollbarAxis, ScrollbarState, Switch, Tab,
    TabList, Table, TableColumn, TableRow, ToggleState,
};
use gpui::{IntoElement, div, prelude::*};

fn gallery() -> impl IntoElement {
    div()
        .flex()
        .flex_col()
        .child(Label::new("Aurora Primitives"))
        .child(Badge::new("Ready").tone(BadgeTone::Success))
        .child(Button::new("save", "Save").on_click(|_, _, _| {}))
        .child(Switch::new("sync", ToggleState::On).on_change(|_, _, _, _| {}))
        .child(Checkbox::new("confirm", "Confirm", ToggleState::Off).on_change(|_, _, _, _| {}))
        .child(
            Input::new("name")
                .label("Name")
                .placeholder("Enter a name")
                .state(InputState::default())
                .on_change(|_, _, _| {})
                .on_submit(|_, _| {}),
        )
        .child(
            List::new("files")
                .items([ListItem::new("readme", "README")])
                .on_select(|_, _, _| {}),
        )
        .child(
            Menu::new("actions")
                .items([MenuItem::new("Open").shortcut("Enter")])
                .on_select(|_, _, _| {}),
        )
        .child(
            TabList::new("views")
                .tabs([Tab::new("editor", "Editor")])
                .selected("editor")
                .on_select(|_, _, _| {}),
        )
        .child(
            Table::new("data")
                .columns([TableColumn::new("name", "Name").width(180)])
                .rows([TableRow::new("row-1", ["Aurora"])]),
        )
        .child(
            Scrollbar::new(
                "scroll",
                ScrollbarState {
                    content_extent: 100.,
                    viewport_extent: 25.,
                    offset: 25.,
                },
            )
            .axis(ScrollbarAxis::Horizontal)
            .track_geometry(0., 100.)
            .drag_origin(Some(ScrollDragOrigin {
                pointer: 25.,
                offset: 25.,
            }))
            .on_scroll(|_, _, _| {}),
        )
        .child(Popover::new("popover", div().child("Popover Content")).on_dismiss(|_, _| {}))
        .child(Modal::new("modal", "Confirm", div().child("Modal Content")).on_dismiss(|_, _| {}))
}

fn main() {
    let _gallery = gallery();
}
