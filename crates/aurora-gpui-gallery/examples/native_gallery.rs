use aurora_gpui_gallery::{GalleryApp, GalleryCatalog};
use aurora_gpui_ui::{Badge, BadgeTone, Button, Label};
use gpui::{
    AppContext, Bounds, Context, IntoElement, ParentElement, Render, Styled, Window, WindowBounds,
    WindowOptions, div, px, size,
};

struct GalleryWindow;

impl Render for GalleryWindow {
    fn render(&mut self, _: &mut Window, _: &mut Context<Self>) -> impl IntoElement {
        let preview = div()
            .child(
                div()
                    .text_size(px(24.))
                    .text_color(gpui::white())
                    .child("Aurora Native Gallery"),
            )
            .child(Label::new("Primitives"))
            .child(Badge::new("Ready").tone(BadgeTone::Success))
            .child(Button::new("gallery-action", "Run Action"));
        div().font_family(".SystemUIFont").child(
            GalleryApp::new("gallery", GalleryCatalog::builtin())
                .query("ui")
                .selected("ui")
                .preview(preview),
        )
    }
}

fn main() {
    gpui_platform::application().run(|cx| {
        let bounds = Bounds::centered(None, size(px(1280.), px(800.)), cx);
        cx.open_window(
            WindowOptions {
                window_bounds: Some(WindowBounds::Windowed(bounds)),
                ..WindowOptions::default()
            },
            |_, cx| cx.new(|_| GalleryWindow),
        )
        .expect("open Aurora GPUI gallery window");
        cx.activate(true);
    });
}
