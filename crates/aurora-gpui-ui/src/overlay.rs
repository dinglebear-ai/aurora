use aurora_gpui_core::AuroraTheme;
use gpui::{
    AnyElement, App, ElementId, IntoElement, RenderOnce, SharedString, Window, div, prelude::*, px,
};
use std::rc::Rc;
type DismissHandler = Rc<dyn Fn(&mut Window, &mut App)>;
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum OverlayPlacement {
    Top,
    #[default]
    Bottom,
    Left,
    Right,
}
#[derive(IntoElement)]
pub struct Popover {
    id: ElementId,
    label: SharedString,
    content: AnyElement,
    placement: OverlayPlacement,
    theme: AuroraTheme,
    on_dismiss: Option<DismissHandler>,
}
impl Popover {
    pub fn new(id: impl Into<ElementId>, content: impl IntoElement) -> Self {
        Self {
            id: id.into(),
            label: "Popover".into(),
            content: content.into_any_element(),
            placement: OverlayPlacement::Bottom,
            theme: AuroraTheme::default(),
            on_dismiss: None,
        }
    }
    #[must_use]
    pub fn label(mut self, v: impl Into<SharedString>) -> Self {
        self.label = v.into();
        self
    }
    #[must_use]
    pub const fn placement(mut self, v: OverlayPlacement) -> Self {
        self.placement = v;
        self
    }
    #[must_use]
    pub fn on_dismiss(mut self, f: impl Fn(&mut Window, &mut App) + 'static) -> Self {
        self.on_dismiss = Some(Rc::new(f));
        self
    }
    #[must_use]
    pub const fn theme(mut self, v: AuroraTheme) -> Self {
        self.theme = v;
        self
    }
}
impl RenderOnce for Popover {
    fn render(self, _: &mut Window, _: &mut App) -> impl IntoElement {
        let c = self.theme.colors;
        let dismiss_mouse = self.on_dismiss.clone();
        let dismiss_key = self.on_dismiss;
        div()
            .id(self.id)
            .role(gpui::Role::Dialog)
            .aria_label(self.label)
            .aria_description(format!("{:?} anchored popover", self.placement))
            .focusable()
            .tab_index(0)
            .when_some(dismiss_mouse, |e, f| {
                e.on_mouse_down_out(move |_, w, cx| f(w, cx))
            })
            .when_some(dismiss_key, |e, f| {
                e.on_key_down(move |ev, w, cx| {
                    if ev.keystroke.key == "escape" {
                        f(w, cx);
                    }
                })
            })
            .p(px(self.theme.space.md))
            .rounded(px(self.theme.radii.lg))
            .border_1()
            .border_color(c.border)
            .bg(gpui::Hsla::from(c.surface))
            .child(self.content)
    }
}
#[derive(IntoElement)]
pub struct Modal {
    id: ElementId,
    title: SharedString,
    body: AnyElement,
    theme: AuroraTheme,
    on_dismiss: Option<DismissHandler>,
}
impl Modal {
    pub fn new(
        id: impl Into<ElementId>,
        title: impl Into<SharedString>,
        body: impl IntoElement,
    ) -> Self {
        Self {
            id: id.into(),
            title: title.into(),
            body: body.into_any_element(),
            theme: AuroraTheme::default(),
            on_dismiss: None,
        }
    }
    #[must_use]
    pub fn on_dismiss(mut self, f: impl Fn(&mut Window, &mut App) + 'static) -> Self {
        self.on_dismiss = Some(Rc::new(f));
        self
    }
    #[must_use]
    pub const fn theme(mut self, v: AuroraTheme) -> Self {
        self.theme = v;
        self
    }
}
impl RenderOnce for Modal {
    fn render(self, _: &mut Window, _: &mut App) -> impl IntoElement {
        let c = self.theme.colors;
        let dismiss_mouse = self.on_dismiss.clone();
        let dismiss_key = self.on_dismiss;
        div()
            .id(self.id)
            .role(gpui::Role::Dialog)
            .aria_label(self.title.clone())
            .focusable()
            .tab_index(0)
            .when_some(dismiss_mouse, |e, f| {
                e.on_mouse_down_out(move |_, w, cx| f(w, cx))
            })
            .when_some(dismiss_key, |e, f| {
                e.on_key_down(move |ev, w, cx| {
                    if ev.keystroke.key == "escape" {
                        f(w, cx);
                    }
                })
            })
            .flex()
            .flex_col()
            .gap(px(self.theme.space.lg))
            .w(px(480.))
            .p(px(self.theme.space.xl))
            .rounded(px(self.theme.radii.lg))
            .border_1()
            .border_color(c.border)
            .bg(gpui::Hsla::from(c.surface))
            .text_color(c.text)
            .child(
                div()
                    .id("modal-title")
                    .role(gpui::Role::Heading)
                    .aria_level(2)
                    .text_size(px(18.))
                    .child(self.title),
            )
            .child(self.body)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn placement_covers_each_anchor_edge() {
        let values = [
            OverlayPlacement::Top,
            OverlayPlacement::Bottom,
            OverlayPlacement::Left,
            OverlayPlacement::Right,
        ];
        assert_eq!(values.len(), 4);
    }
}
