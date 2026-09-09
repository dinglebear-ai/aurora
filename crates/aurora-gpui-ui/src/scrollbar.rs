use aurora_gpui_core::AuroraTheme;
use gpui::{App, ElementId, IntoElement, RenderOnce, Window, div, prelude::*, px};
use std::rc::Rc;
type ScrollHandler = Rc<dyn Fn(f32, &mut Window, &mut App)>;
type BeginDragHandler = Rc<dyn Fn(ScrollDragOrigin, &mut Window, &mut App)>;
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum ScrollbarAxis {
    #[default]
    Vertical,
    Horizontal,
}
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct ScrollbarState {
    pub content_extent: f32,
    pub viewport_extent: f32,
    pub offset: f32,
}
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct ScrollDragOrigin {
    pub pointer: f32,
    pub offset: f32,
}
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum ScrollPointerDecision {
    PageBackward(f32),
    BeginDrag,
    PageForward(f32),
    DragTo(f32),
}
impl ScrollbarState {
    #[must_use]
    pub fn thumb(&self) -> (f32, f32) {
        if self.content_extent <= 0. || self.viewport_extent >= self.content_extent {
            return (0., 1.);
        }
        let ratio = (self.viewport_extent / self.content_extent).clamp(0., 1.);
        let max = (self.content_extent - self.viewport_extent).max(1.);
        ((self.offset / max).clamp(0., 1.) * (1. - ratio), ratio)
    }
    #[must_use]
    pub fn page(&self, direction: f32) -> f32 {
        let max = (self.content_extent - self.viewport_extent).max(0.);
        (self.offset + direction * self.viewport_extent).clamp(0., max)
    }
    #[must_use]
    pub const fn drag_origin(&self, pointer: f32) -> ScrollDragOrigin {
        ScrollDragOrigin {
            pointer,
            offset: self.offset,
        }
    }
    #[must_use]
    pub fn pointer_decision(
        &self,
        track_origin: f32,
        track_extent: f32,
        pointer: f32,
        drag: Option<ScrollDragOrigin>,
    ) -> ScrollPointerDecision {
        let max_offset = (self.content_extent - self.viewport_extent).max(0.);
        let (start, fraction) = self.thumb();
        let thumb_start = track_origin + start * track_extent;
        let thumb_extent = fraction * track_extent;
        if let Some(origin) = drag {
            let usable = (track_extent - thumb_extent).max(1.);
            let initial = (origin.offset / max_offset.max(1.)) * usable;
            let next =
                ((initial + pointer - origin.pointer) / usable * max_offset).clamp(0., max_offset);
            return ScrollPointerDecision::DragTo(next);
        }
        if pointer < thumb_start {
            ScrollPointerDecision::PageBackward(self.page(-1.))
        } else if pointer > thumb_start + thumb_extent {
            ScrollPointerDecision::PageForward(self.page(1.))
        } else {
            ScrollPointerDecision::BeginDrag
        }
    }
}
#[derive(IntoElement)]
pub struct Scrollbar {
    id: ElementId,
    state: ScrollbarState,
    axis: ScrollbarAxis,
    label: gpui::SharedString,
    theme: AuroraTheme,
    on_scroll: Option<ScrollHandler>,
    on_begin_drag: Option<BeginDragHandler>,
    track_origin: f32,
    track_extent: f32,
    drag_origin: Option<ScrollDragOrigin>,
}
impl Scrollbar {
    pub fn new(id: impl Into<ElementId>, state: ScrollbarState) -> Self {
        Self {
            id: id.into(),
            state,
            axis: ScrollbarAxis::Vertical,
            label: "Scrollbar".into(),
            theme: AuroraTheme::default(),
            on_scroll: None,
            on_begin_drag: None,
            track_origin: 0.,
            track_extent: 100.,
            drag_origin: None,
        }
    }
    #[must_use]
    pub const fn axis(mut self, v: ScrollbarAxis) -> Self {
        self.axis = v;
        self
    }
    #[must_use]
    pub fn label(mut self, v: impl Into<gpui::SharedString>) -> Self {
        self.label = v.into();
        self
    }
    #[must_use]
    pub fn on_scroll(mut self, f: impl Fn(f32, &mut Window, &mut App) + 'static) -> Self {
        self.on_scroll = Some(Rc::new(f));
        self
    }
    #[must_use]
    pub fn on_begin_drag(
        mut self,
        f: impl Fn(ScrollDragOrigin, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_begin_drag = Some(Rc::new(f));
        self
    }
    #[must_use]
    pub const fn track_geometry(mut self, origin: f32, extent: f32) -> Self {
        self.track_origin = origin;
        self.track_extent = extent;
        self
    }
    #[must_use]
    pub const fn drag_origin(mut self, origin: Option<ScrollDragOrigin>) -> Self {
        self.drag_origin = origin;
        self
    }
    #[must_use]
    pub const fn theme(mut self, v: AuroraTheme) -> Self {
        self.theme = v;
        self
    }
}
impl RenderOnce for Scrollbar {
    #[allow(clippy::too_many_lines)]
    fn render(self, _: &mut Window, _: &mut App) -> impl IntoElement {
        let (start, fraction) = self.state.thumb();
        let c = self.theme.colors;
        let page = self.state.page(1.);
        let decrement = self.state.page(-1.);
        let click = self.on_scroll.clone();
        let begin_drag = self.on_begin_drag;
        let click_state = self.state;
        let click_axis = self.axis;
        let click_track_origin = self.track_origin;
        let click_track_extent = self.track_extent;
        let drag = self.on_scroll.clone();
        let inc = self.on_scroll.clone();
        let dec = self.on_scroll;
        div()
            .id(self.id)
            .role(gpui::Role::ScrollBar)
            .aria_label(self.label)
            .aria_orientation(if matches!(self.axis, ScrollbarAxis::Vertical) {
                gpui::Orientation::Vertical
            } else {
                gpui::Orientation::Horizontal
            })
            .aria_min_numeric_value(0.)
            .aria_max_numeric_value(f64::from(
                (self.state.content_extent - self.state.viewport_extent).max(0.),
            ))
            .aria_numeric_value(f64::from(self.state.offset))
            .focusable()
            .tab_index(0)
            .on_mouse_down(gpui::MouseButton::Left, move |event, w, cx| {
                let pointer = f32::from(if matches!(click_axis, ScrollbarAxis::Vertical) {
                    event.position.y
                } else {
                    event.position.x
                });
                match click_state.pointer_decision(
                    click_track_origin,
                    click_track_extent,
                    pointer,
                    None,
                ) {
                    ScrollPointerDecision::PageBackward(v)
                    | ScrollPointerDecision::PageForward(v)
                    | ScrollPointerDecision::DragTo(v) => {
                        if let Some(f) = &click {
                            f(v, w, cx);
                        }
                    }
                    ScrollPointerDecision::BeginDrag => {
                        if let Some(f) = &begin_drag {
                            f(click_state.drag_origin(pointer), w, cx);
                        }
                    }
                }
            })
            .when_some(drag, |e, f| {
                let state = self.state;
                let axis = self.axis;
                let origin = self.track_origin;
                let extent = self.track_extent;
                let drag_origin = self.drag_origin;
                e.on_mouse_move(move |event, w, cx| {
                    if event.dragging()
                        && let Some(drag_origin) = drag_origin
                    {
                        let pointer = f32::from(if matches!(axis, ScrollbarAxis::Vertical) {
                            event.position.y
                        } else {
                            event.position.x
                        });
                        if let ScrollPointerDecision::DragTo(value) =
                            state.pointer_decision(origin, extent, pointer, Some(drag_origin))
                        {
                            f(value, w, cx);
                        }
                    }
                })
            })
            .when_some(inc, |e, f| {
                e.on_a11y_action(gpui::AccessibleAction::Increment, move |_, w, cx| {
                    f(page, w, cx);
                })
            })
            .when_some(dec, |e, f| {
                e.on_a11y_action(gpui::AccessibleAction::Decrement, move |_, w, cx| {
                    f(decrement, w, cx);
                })
            })
            .rounded(px(self.theme.radii.pill))
            .bg(gpui::Hsla::from(c.surface_active))
            .when(matches!(self.axis, ScrollbarAxis::Vertical), |e| {
                e.w(px(8.))
                    .h_full()
                    .flex()
                    .flex_col()
                    .child(div().w_full().h(gpui::relative(start)))
                    .child(
                        div()
                            .w_full()
                            .h(gpui::relative(fraction))
                            .rounded(px(self.theme.radii.pill))
                            .bg(gpui::Hsla::from(c.text_muted)),
                    )
            })
            .when(matches!(self.axis, ScrollbarAxis::Horizontal), |e| {
                e.h(px(8.))
                    .w_full()
                    .flex()
                    .child(div().h_full().w(gpui::relative(start)))
                    .child(
                        div()
                            .h_full()
                            .w(gpui::relative(fraction))
                            .rounded(px(self.theme.radii.pill))
                            .bg(gpui::Hsla::from(c.text_muted)),
                    )
            })
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn thumb_is_proportional_and_offset() {
        assert_eq!(
            ScrollbarState {
                content_extent: 100.,
                viewport_extent: 25.,
                offset: 50.
            }
            .thumb(),
            (0.5, 0.25)
        );
        assert_eq!(
            ScrollbarState {
                content_extent: 10.,
                viewport_extent: 20.,
                offset: 0.
            }
            .thumb(),
            (0., 1.)
        );
    }
    #[test]
    fn paging_clamps() {
        let s = ScrollbarState {
            content_extent: 100.,
            viewport_extent: 25.,
            offset: 50.,
        };
        assert!((s.page(1.) - 75.).abs() < f32::EPSILON);
        assert!((s.page(-1.) - 25.).abs() < f32::EPSILON);
    }
    #[test]
    fn pointer_geometry_pages_and_drags() {
        let s = ScrollbarState {
            content_extent: 100.,
            viewport_extent: 25.,
            offset: 50.,
        };
        assert_eq!(
            s.pointer_decision(0., 100., 40., None),
            ScrollPointerDecision::PageBackward(25.)
        );
        assert_eq!(
            s.pointer_decision(0., 100., 60., None),
            ScrollPointerDecision::BeginDrag
        );
        assert_eq!(
            s.pointer_decision(0., 100., 90., None),
            ScrollPointerDecision::PageForward(75.)
        );
        assert_eq!(
            s.pointer_decision(
                0.,
                100.,
                70.,
                Some(ScrollDragOrigin {
                    pointer: 50.,
                    offset: 50.
                })
            ),
            ScrollPointerDecision::DragTo(70.)
        );
    }
    #[test]
    fn thumb_mouse_down_origin_drives_subsequent_drag_offset() {
        let state = ScrollbarState {
            content_extent: 100.,
            viewport_extent: 25.,
            offset: 50.,
        };
        let pointer_down = 60.;
        assert_eq!(
            state.pointer_decision(0., 100., pointer_down, None),
            ScrollPointerDecision::BeginDrag
        );

        let origin = state.drag_origin(pointer_down);
        assert_eq!(
            origin,
            ScrollDragOrigin {
                pointer: 60.,
                offset: 50.
            }
        );
        assert_eq!(
            state.pointer_decision(0., 100., 75., Some(origin)),
            ScrollPointerDecision::DragTo(65.)
        );
    }
}
