use aurora_gpui_core::AuroraTheme;
use gpui::{App, ElementId, IntoElement, RenderOnce, SharedString, Window, div, prelude::*, px};
use std::rc::Rc;
type SelectHandler = Rc<dyn Fn(usize, &mut Window, &mut App)>;
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct MenuItem {
    pub label: SharedString,
    pub shortcut: Option<SharedString>,
    pub disabled: bool,
    pub separator_before: bool,
}
impl MenuItem {
    pub fn new(label: impl Into<SharedString>) -> Self {
        Self {
            label: label.into(),
            shortcut: None,
            disabled: false,
            separator_before: false,
        }
    }
    #[must_use]
    pub fn shortcut(mut self, v: impl Into<SharedString>) -> Self {
        self.shortcut = Some(v.into());
        self
    }
    #[must_use]
    pub const fn disabled(mut self, v: bool) -> Self {
        self.disabled = v;
        self
    }
    #[must_use]
    pub const fn separator_before(mut self, v: bool) -> Self {
        self.separator_before = v;
        self
    }
}
#[must_use]
pub fn next_menu_item(items: &[MenuItem], selected: Option<usize>, delta: isize) -> Option<usize> {
    if items.is_empty() {
        return None;
    }
    let start = selected.unwrap_or(if delta < 0 { 0 } else { items.len() - 1 });
    (1..=items.len())
        .map(|n| {
            (start.cast_signed() + delta * n.cast_signed())
                .rem_euclid(items.len().cast_signed())
                .cast_unsigned()
        })
        .find(|&i| !items[i].disabled)
}
#[derive(IntoElement)]
pub struct Menu {
    id: ElementId,
    items: Vec<MenuItem>,
    selected: Option<usize>,
    label: SharedString,
    theme: AuroraTheme,
    on_select: Option<SelectHandler>,
}
impl Menu {
    pub fn new(id: impl Into<ElementId>) -> Self {
        Self {
            id: id.into(),
            items: vec![],
            selected: None,
            label: "Menu".into(),
            theme: AuroraTheme::default(),
            on_select: None,
        }
    }
    #[must_use]
    pub fn items(mut self, v: impl IntoIterator<Item = MenuItem>) -> Self {
        self.items = v.into_iter().collect();
        self
    }
    #[must_use]
    pub const fn selected(mut self, v: usize) -> Self {
        self.selected = Some(v);
        self
    }
    #[must_use]
    pub fn label(mut self, v: impl Into<SharedString>) -> Self {
        self.label = v.into();
        self
    }
    #[must_use]
    pub fn on_select(mut self, f: impl Fn(usize, &mut Window, &mut App) + 'static) -> Self {
        self.on_select = Some(Rc::new(f));
        self
    }
    #[must_use]
    pub const fn theme(mut self, v: AuroraTheme) -> Self {
        self.theme = v;
        self
    }
}
impl RenderOnce for Menu {
    fn render(self, _: &mut Window, _: &mut App) -> impl IntoElement {
        let c = self.theme.colors;
        let nav_items = self.items.clone();
        let nav_selected = self.selected;
        let nav_handler = self.on_select.clone();
        div()
            .id(self.id)
            .role(gpui::Role::Menu)
            .aria_label(self.label)
            .focusable()
            .tab_index(0)
            .on_key_down(move |ev, w, cx| {
                if ev.keystroke.key == "enter" {
                    if let (Some(index), Some(f)) = (nav_selected, &nav_handler)
                        && nav_items.get(index).is_some_and(|item| !item.disabled)
                    {
                        f(index, w, cx);
                    }
                    return;
                }
                let d = match ev.keystroke.key.as_str() {
                    "down" => 1,
                    "up" => -1,
                    _ => return,
                };
                if let (Some(i), Some(f)) =
                    (next_menu_item(&nav_items, nav_selected, d), &nav_handler)
                {
                    f(i, w, cx);
                }
            })
            .flex()
            .flex_col()
            .p(px(self.theme.space.xs))
            .min_w(px(180.))
            .rounded(px(self.theme.radii.lg))
            .border_1()
            .border_color(c.border)
            .bg(gpui::Hsla::from(c.surface))
            .children(self.items.into_iter().enumerate().map(|(index, i)| {
                let active = self.selected == Some(index);
                let callback = self.on_select.clone();
                let mut el = div()
                    .id(("menu-item", index))
                    .role(gpui::Role::MenuItem)
                    .aria_label(i.label.clone())
                    .aria_selected(active)
                    .when(
                        active,
                        gpui::StatefulInteractiveElement::aria_active_descendant,
                    )
                    .flex()
                    .justify_between()
                    .px(px(self.theme.space.sm))
                    .py(px(self.theme.space.sm))
                    .when(i.separator_before, |e| {
                        e.border_t_1().border_color(c.border)
                    })
                    .rounded(px(self.theme.radii.sm))
                    .text_color(c.text)
                    .when(!i.disabled, |e| {
                        e.cursor_pointer()
                            .hover(|s| s.bg(gpui::Hsla::from(c.surface_hover)))
                    })
                    .when(i.disabled, |e| e.opacity(0.45))
                    .child(i.label)
                    .children(i.shortcut.map(|s| div().text_color(c.text_muted).child(s)));
                if let Some(f) = callback.filter(|_| !i.disabled) {
                    el = el.on_click(move |_, w, cx| f(index, w, cx));
                }
                el
            }))
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn navigation_suppresses_disabled() {
        let i = [MenuItem::new("A"), MenuItem::new("B").disabled(true)];
        assert_eq!(next_menu_item(&i, Some(0), 1), Some(0));
    }
}
