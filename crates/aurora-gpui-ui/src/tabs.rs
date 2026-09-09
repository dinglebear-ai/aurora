use aurora_gpui_core::AuroraTheme;
use gpui::{App, ElementId, IntoElement, RenderOnce, SharedString, Window, div, prelude::*, px};
use std::rc::Rc;
type SelectHandler = Rc<dyn Fn(SharedString, &mut Window, &mut App)>;
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Tab {
    pub id: SharedString,
    pub label: SharedString,
    pub disabled: bool,
}
impl Tab {
    pub fn new(id: impl Into<SharedString>, label: impl Into<SharedString>) -> Self {
        Self {
            id: id.into(),
            label: label.into(),
            disabled: false,
        }
    }
    #[must_use]
    pub const fn disabled(mut self, v: bool) -> Self {
        self.disabled = v;
        self
    }
}
#[must_use]
pub fn adjacent_tab(tabs: &[Tab], selected: Option<&str>, delta: isize) -> Option<SharedString> {
    if tabs.is_empty() {
        return None;
    }
    let start = selected
        .and_then(|s| tabs.iter().position(|t| t.id.as_ref() == s))
        .unwrap_or(0);
    (1..=tabs.len())
        .map(|n| {
            (start.cast_signed() + delta * n.cast_signed())
                .rem_euclid(tabs.len().cast_signed())
                .cast_unsigned()
        })
        .find(|&i| !tabs[i].disabled)
        .map(|i| tabs[i].id.clone())
}
#[derive(IntoElement)]
pub struct TabList {
    id: ElementId,
    tabs: Vec<Tab>,
    selected: Option<SharedString>,
    label: SharedString,
    theme: AuroraTheme,
    on_select: Option<SelectHandler>,
}
impl TabList {
    pub fn new(id: impl Into<ElementId>) -> Self {
        Self {
            id: id.into(),
            tabs: vec![],
            selected: None,
            label: "Tabs".into(),
            theme: AuroraTheme::default(),
            on_select: None,
        }
    }
    #[must_use]
    pub fn tabs(mut self, v: impl IntoIterator<Item = Tab>) -> Self {
        self.tabs = v.into_iter().collect();
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
impl RenderOnce for TabList {
    fn render(self, _: &mut Window, _: &mut App) -> impl IntoElement {
        let c = self.theme.colors;
        let nav_tabs = self.tabs.clone();
        let nav_selected = self.selected.clone();
        let nav_handler = self.on_select.clone();
        div()
            .id(self.id)
            .role(gpui::Role::TabList)
            .aria_label(self.label)
            .focusable()
            .tab_index(0)
            .on_key_down(move |ev, w, cx| {
                let d = match ev.keystroke.key.as_str() {
                    "left" => -1,
                    "right" => 1,
                    _ => return,
                };
                if let (Some(next), Some(f)) = (
                    adjacent_tab(&nav_tabs, nav_selected.as_deref(), d),
                    &nav_handler,
                ) {
                    f(next, w, cx);
                }
            })
            .flex()
            .gap(px(self.theme.space.xs))
            .border_b_1()
            .border_color(c.border)
            .children(self.tabs.into_iter().map(|tab| {
                let active = self.selected.as_ref() == Some(&tab.id);
                let callback = self.on_select.clone();
                let id = tab.id.clone();
                let mut el = div()
                    .id(tab.id)
                    .role(gpui::Role::Tab)
                    .aria_label(tab.label.clone())
                    .aria_selected(active)
                    .when(
                        active,
                        gpui::StatefulInteractiveElement::aria_active_descendant,
                    )
                    .px(px(self.theme.space.md))
                    .py(px(self.theme.space.sm))
                    .border_b_2()
                    .border_color(if active {
                        c.primary
                    } else {
                        c.background.with_alpha(0)
                    })
                    .text_color(if active { c.text } else { c.text_muted })
                    .when(!tab.disabled, gpui::Styled::cursor_pointer)
                    .when(tab.disabled, |e| e.opacity(0.45))
                    .child(tab.label);
                if let Some(f) = callback.filter(|_| !tab.disabled) {
                    el = el.on_click(move |_, w, cx| f(id.clone(), w, cx));
                }
                el
            }))
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn keyboard_skips_disabled_and_wraps() {
        let t = [
            Tab::new("a", "A"),
            Tab::new("b", "B").disabled(true),
            Tab::new("c", "C"),
        ];
        assert_eq!(adjacent_tab(&t, Some("a"), 1).as_deref(), Some("c"));
        assert_eq!(adjacent_tab(&t, Some("a"), -1).as_deref(), Some("c"));
    }
}
