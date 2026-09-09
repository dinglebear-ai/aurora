use aurora_gpui_core::AuroraTheme;
use gpui::{App, ElementId, IntoElement, RenderOnce, SharedString, Window, div, prelude::*, px};
use std::rc::Rc;
type SelectHandler = Rc<dyn Fn(SharedString, &mut Window, &mut App)>;
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ListItem {
    pub id: SharedString,
    pub label: SharedString,
    pub description: Option<SharedString>,
    pub disabled: bool,
}
impl ListItem {
    pub fn new(id: impl Into<SharedString>, label: impl Into<SharedString>) -> Self {
        Self {
            id: id.into(),
            label: label.into(),
            description: None,
            disabled: false,
        }
    }
    #[must_use]
    pub fn description(mut self, v: impl Into<SharedString>) -> Self {
        self.description = Some(v.into());
        self
    }
    #[must_use]
    pub const fn disabled(mut self, v: bool) -> Self {
        self.disabled = v;
        self
    }
}
#[must_use]
pub fn next_enabled(
    items: &[ListItem],
    selected: Option<&str>,
    delta: isize,
) -> Option<SharedString> {
    if items.is_empty() {
        return None;
    }
    let start = selected
        .and_then(|s| items.iter().position(|i| i.id.as_ref() == s))
        .unwrap_or(if delta < 0 { 0 } else { items.len() - 1 });
    (1..=items.len())
        .map(|step| {
            (start.cast_signed() + delta * step.cast_signed())
                .rem_euclid(items.len().cast_signed())
                .cast_unsigned()
        })
        .find(|&i| !items[i].disabled)
        .map(|i| items[i].id.clone())
}
#[derive(IntoElement)]
pub struct List {
    id: ElementId,
    items: Vec<ListItem>,
    selected: Option<SharedString>,
    label: SharedString,
    theme: AuroraTheme,
    on_select: Option<SelectHandler>,
}
impl List {
    pub fn new(id: impl Into<ElementId>) -> Self {
        Self {
            id: id.into(),
            items: vec![],
            selected: None,
            label: "List".into(),
            theme: AuroraTheme::default(),
            on_select: None,
        }
    }
    #[must_use]
    pub fn items(mut self, v: impl IntoIterator<Item = ListItem>) -> Self {
        self.items = v.into_iter().collect();
        self
    }
    #[must_use]
    pub fn selected(mut self, v: impl Into<SharedString>) -> Self {
        self.selected = Some(v.into());
        self
    }
    #[must_use]
    pub fn label(mut self, v: impl Into<SharedString>) -> Self {
        self.label = v.into();
        self
    }
    #[must_use]
    pub fn on_select(mut self, f: impl Fn(SharedString, &mut Window, &mut App) + 'static) -> Self {
        self.on_select = Some(Rc::new(f));
        self
    }
    #[must_use]
    pub const fn theme(mut self, v: AuroraTheme) -> Self {
        self.theme = v;
        self
    }
}
impl RenderOnce for List {
    fn render(self, _: &mut Window, _: &mut App) -> impl IntoElement {
        let c = self.theme.colors;
        let nav_items = self.items.clone();
        let nav_selected = self.selected.clone();
        let nav_handler = self.on_select.clone();
        div()
            .id(self.id)
            .role(gpui::Role::List)
            .aria_label(self.label)
            .focusable()
            .tab_index(0)
            .on_key_down(move |ev, w, cx| {
                if ev.keystroke.key == "enter" {
                    if let (Some(selected), Some(f)) = (&nav_selected, &nav_handler)
                        && nav_items
                            .iter()
                            .any(|item| item.id == *selected && !item.disabled)
                    {
                        f(selected.clone(), w, cx);
                    }
                    return;
                }
                let delta = match ev.keystroke.key.as_str() {
                    "down" => 1,
                    "up" => -1,
                    _ => return,
                };
                if let (Some(next), Some(f)) = (
                    next_enabled(&nav_items, nav_selected.as_deref(), delta),
                    &nav_handler,
                ) {
                    f(next, w, cx);
                }
            })
            .flex()
            .flex_col()
            .gap(px(self.theme.space.xxs))
            .children(self.items.into_iter().map(|item| {
                let active = self.selected.as_ref() == Some(&item.id);
                let callback = self.on_select.clone();
                let item_id = item.id.clone();
                let mut row = div()
                    .id(item.id.clone())
                    .role(gpui::Role::ListBoxOption)
                    .aria_label(item.label.clone())
                    .aria_selected(active)
                    .when(
                        active,
                        gpui::StatefulInteractiveElement::aria_active_descendant,
                    )
                    .flex()
                    .flex_col()
                    .px(px(self.theme.space.md))
                    .py(px(self.theme.space.sm))
                    .rounded(px(self.theme.radii.md))
                    .border_1()
                    .border_color(if active {
                        c.border_focused
                    } else {
                        c.background.with_alpha(0)
                    })
                    .bg(gpui::Hsla::from(if active {
                        c.surface_active
                    } else {
                        c.background.with_alpha(0)
                    }))
                    .text_color(c.text)
                    .when(!item.disabled, |e| {
                        e.cursor_pointer()
                            .hover(|s| s.bg(gpui::Hsla::from(c.surface_hover)))
                    })
                    .when(item.disabled, |e| e.opacity(0.45))
                    .child(item.label)
                    .children(
                        item.description
                            .map(|d| div().text_color(c.text_muted).child(d)),
                    );
                if let Some(f) = callback.filter(|_| !item.disabled) {
                    row = row.on_click(move |_, w, cx| f(item_id.clone(), w, cx));
                }
                row
            }))
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn navigation_skips_disabled() {
        let items = [
            ListItem::new("a", "A"),
            ListItem::new("b", "B").disabled(true),
            ListItem::new("c", "C"),
        ];
        assert_eq!(next_enabled(&items, Some("a"), 1).as_deref(), Some("c"));
        assert_eq!(next_enabled(&items, Some("a"), -1).as_deref(), Some("c"));
    }
}
