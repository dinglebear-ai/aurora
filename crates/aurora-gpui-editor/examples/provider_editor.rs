use aurora_gpui_editor::{
    Completion, CompletionProvider, Diagnostic, DiagnosticProvider, DiagnosticSeverity,
    EditorAction, EditorChrome, EditorController, EditorGeometry, EditorModel, EditorProviders,
    Hover, HoverProvider, Inlay, InlayProvider, Movement, OperableEditor, Point, StringBuffer,
};
use gpui::{App, Context, IntoElement, Render, Window};
use std::{ops::Range, sync::Arc};

struct RustProvider;
impl CompletionProvider for RustProvider {
    fn completions(&self, _: &str, _: Point) -> Vec<Completion> {
        vec![Completion {
            label: "println!".into(),
            detail: Some("macro".into()),
            replacement: "println!(\"Aurora\");".into(),
        }]
    }
}
impl HoverProvider for RustProvider {
    fn hover(&self, _: &str, position: Point) -> Option<Hover> {
        Some(Hover {
            range: Some(position..Point::new(position.row, position.column + 1)),
            contents: "Aurora provider-backed hover".into(),
        })
    }
}
impl DiagnosticProvider for RustProvider {
    fn diagnostics(&self, _: &str) -> Vec<Diagnostic> {
        vec![Diagnostic {
            range: Point::new(1, 4)..Point::new(1, 8),
            severity: DiagnosticSeverity::Hint,
            message: "Try a completion".into(),
        }]
    }
}
impl InlayProvider for RustProvider {
    fn inlays(&self, _: &str, _: Range<usize>) -> Vec<Inlay> {
        vec![Inlay {
            position: Point::new(0, 9),
            label: "fn main()".into(),
        }]
    }
}

fn editor(cx: &mut App) -> impl IntoElement {
    let provider = Arc::new(RustProvider);
    let providers = EditorProviders {
        completion: Some(provider.clone()),
        hover: Some(provider.clone()),
        diagnostics: Some(provider.clone()),
        inlays: Some(provider),
    };
    let controller = EditorController::new(EditorModel::new(StringBuffer::new(
        "fn main() {\n    todo!();\n}",
    )));
    controller.dispatch(EditorAction::StartSearch, None);
    controller.dispatch(EditorAction::UpdateSearch("todo".into()), None);
    controller.dispatch(EditorAction::ToggleFold(0..3), None);
    controller.dispatch(EditorAction::ToggleFold(0..3), None);
    controller.dispatch(EditorAction::Move(Movement::LineEnd), None);
    OperableEditor::new(controller, cx)
        .providers(providers)
        .geometry(EditorGeometry {
            character_width: 8.5,
            line_height: 21.,
            ..EditorGeometry::default()
        })
        .chrome(EditorChrome {
            title: Some("Provider Editor".into()),
            breadcrumb: vec!["examples".into(), "main.rs".into()],
            language: Some("Rust".into()),
            ..EditorChrome::default()
        })
}

struct ProviderEditorDemo;
impl Render for ProviderEditorDemo {
    fn render(&mut self, _window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        editor(cx)
    }
}

fn main() {
    std::hint::black_box(ProviderEditorDemo);
}
