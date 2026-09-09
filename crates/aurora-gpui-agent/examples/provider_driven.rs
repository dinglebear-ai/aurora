//! Compile-checked catalog demonstrating every agent/chat surface.

use std::collections::BTreeSet;

use aurora_gpui_agent::{
    AgentComposer, AgentConversation, AiEdit, Approval, ApprovalId, ApprovalState, Artifact,
    ArtifactId, Attachment, AttachmentId, AttachmentKind, Capability, Citation, Command, CommandId,
    Composer, ContentPart, Conversation, ConversationEvent, DiffHunk, EditId, Elicitation,
    ElicitationId, ElicitationKind, ElicitationState, Mention, MentionId, Message, MessageStatus,
    Model, ModelId, ModelSelector, Provider, ProviderId, ProviderSelection, Role, ToolCall,
    ToolCallId, ToolCallState, ToolResult,
};
use gpui::{App, IntoElement, RenderOnce, Window};

// Hosts choose their platform/window options. This compile-checked harness
// proves each component reaches GPUI's element boundary once those are supplied.
pub fn render_harness(
    timeline: AgentConversation,
    composer: AgentComposer,
    selector: ModelSelector,
    window: &mut Window,
    app: &mut App,
) {
    let _ = timeline.render(window, app).into_any_element();
    let _ = composer.render(window, app).into_any_element();
    let _ = selector.render(window, app).into_any_element();
}

#[allow(clippy::too_many_lines)]
fn main() {
    let model = Model {
        id: ModelId("aurora".into()),
        label: "Aurora".into(),
        description: Some("Tool-capable model".into()),
        capabilities: BTreeSet::from([
            Capability::Attachments,
            Capability::Images,
            Capability::Tools,
            Capability::Approvals,
            Capability::Citations,
            Capability::Artifacts,
        ]),
    };
    let providers = vec![Provider::new("example", "Example", vec![model])];
    let selection = ProviderSelection::resolve(
        &providers,
        &ProviderId("example".into()),
        &ModelId("aurora".into()),
    )
    .unwrap();
    let mut composer = Composer::new(selection.clone());
    composer.text = "Update @file".into();
    composer.mentions.push(Mention {
        id: MentionId("file".into()),
        label: "file".into(),
        target: "src/lib.rs".into(),
    });
    composer.attachments.push(Attachment {
        id: AttachmentId("context".into()),
        name: "context.rs".into(),
        kind: AttachmentKind::File,
        media_type: Some("text/rust".into()),
        byte_len: Some(128),
    });
    composer.commands.push(Command {
        id: CommandId("fix".into()),
        label: "Fix".into(),
        description: "Apply a fix".into(),
        shortcut: Some("/fix".into()),
    });
    let _submission = composer.prepare_submission(&providers).unwrap();
    composer.queue_current().unwrap();

    let mut assistant = Message::new("assistant", Role::Assistant);
    assistant.status = MessageStatus::Streaming;
    assistant.parts = vec![
        ContentPart::Text("Working".into()),
        ContentPart::Reasoning("Checking constraints".into()),
        ContentPart::Code {
            language: Some("rust".into()),
            code: "fn main() {}".into(),
        },
        ContentPart::ToolCall(ToolCall {
            id: ToolCallId("tool".into()),
            name: "read".into(),
            arguments: "{}".into(),
            state: ToolCallState::Complete(ToolResult {
                summary: "Read file".into(),
                content: Some("content".into()),
                is_error: false,
            }),
        }),
        ContentPart::Approval(Approval {
            id: ApprovalId("approval".into()),
            title: "Write file".into(),
            description: "Apply generated patch".into(),
            state: ApprovalState::Pending,
        }),
        ContentPart::Elicitation(Elicitation {
            id: ElicitationId("question".into()),
            prompt: "Choose style".into(),
            kind: ElicitationKind::Choice,
            choices: vec!["Compact".into(), "Expanded".into()],
            state: ElicitationState::Pending,
        }),
        ContentPart::Citation(Citation {
            label: "Documentation".into(),
            uri: "https://example.test/docs".into(),
            excerpt: Some("API contract".into()),
        }),
        ContentPart::Artifact(Artifact {
            id: ArtifactId("artifact".into()),
            title: "Preview".into(),
            media_type: "text/html".into(),
            uri: "artifact://preview".into(),
        }),
        ContentPart::AiEdit(AiEdit {
            id: EditId("edit".into()),
            path: "src/lib.rs".into(),
            summary: "Add component".into(),
            hunks: vec![DiffHunk {
                old_start: 1,
                new_start: 1,
                removed: vec!["old".into()],
                added: vec!["new".into()],
            }],
            applied: false,
        }),
    ];
    let mut conversation = Conversation::new("example");
    conversation
        .apply(ConversationEvent::StreamStarted)
        .unwrap();
    conversation
        .apply(ConversationEvent::MessageAdded(assistant))
        .unwrap();

    let _timeline = AgentConversation::new("conversation", conversation);
    let composer_component = AgentComposer::new("composer", composer);
    assert_eq!(composer_component.render_plan().queued_prompt_count, 1);
    assert_eq!(
        composer_component
            .render_plan()
            .queue_status_label
            .as_deref(),
        Some("1 queued prompts")
    );
    let _selector = ModelSelector::new("models", providers, selection);
}
