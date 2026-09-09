use crate::{
    ApprovalState, Composer, ComposerState, ContentPart, Conversation, MessageId, MessageStatus,
    Role, StreamState, ToolCallState,
};
use std::fmt::Write as _;

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Accessibility {
    pub label: String,
    pub description: Option<String>,
    pub live_region: Option<LiveRegion>,
    pub busy: bool,
}
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum LiveRegion {
    Polite,
    Assertive,
}
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum StatusTone {
    Neutral,
    Accent,
    Positive,
    Warning,
    Danger,
}
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Action {
    Copy,
    Retry,
    Cancel,
    Approval {
        id: crate::ApprovalId,
        decision: crate::ApprovalDecision,
    },
    Elicitation {
        id: crate::ElicitationId,
        value: String,
    },
    Edit {
        id: crate::EditId,
        hunk: Option<usize>,
        apply: bool,
    },
    OpenCitation {
        uri: String,
    },
    OpenArtifact {
        id: crate::ArtifactId,
    },
    RemoveAttachment {
        id: crate::AttachmentId,
    },
    Submit,
}
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Announcement {
    pub text: String,
    pub priority: LiveRegion,
}
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PartView {
    pub label: String,
    pub body: Option<String>,
    pub tone: StatusTone,
    pub actions: Vec<Action>,
}

impl From<&ContentPart> for PartView {
    #[allow(clippy::too_many_lines)]
    fn from(part: &ContentPart) -> Self {
        match part {
            ContentPart::Text(text) => Self {
                label: "Response".into(),
                body: Some(text.clone()),
                tone: StatusTone::Neutral,
                actions: vec![Action::Copy],
            },
            ContentPart::Reasoning(text) => Self {
                label: "Reasoning".into(),
                body: Some(text.clone()),
                tone: StatusTone::Neutral,
                actions: Vec::new(),
            },
            ContentPart::Code { language, code } => Self {
                label: language.clone().unwrap_or_else(|| "Code".into()),
                body: Some(code.clone()),
                tone: StatusTone::Neutral,
                actions: vec![Action::Copy],
            },
            ContentPart::ToolCall(tool) => {
                let (tone, body) = match &tool.state {
                    ToolCallState::Pending => (StatusTone::Neutral, "Waiting".into()),
                    ToolCallState::Running => (StatusTone::Accent, "Running".into()),
                    ToolCallState::Complete(result) => (
                        if result.is_error {
                            StatusTone::Danger
                        } else {
                            StatusTone::Positive
                        },
                        result.summary.clone(),
                    ),
                    ToolCallState::Failed(error) => (StatusTone::Danger, error.message.clone()),
                    ToolCallState::Cancelled => (StatusTone::Warning, "Cancelled".into()),
                };
                Self {
                    label: tool.name.clone(),
                    body: Some(body),
                    tone,
                    actions: Vec::new(),
                }
            }
            ContentPart::Approval(approval) => Self {
                label: approval.title.clone(),
                body: Some(approval.description.clone()),
                tone: if approval.state == ApprovalState::Pending {
                    StatusTone::Warning
                } else {
                    StatusTone::Neutral
                },
                actions: if approval.state == ApprovalState::Pending {
                    vec![
                        Action::Approval {
                            id: approval.id.clone(),
                            decision: crate::ApprovalDecision::Approve,
                        },
                        Action::Approval {
                            id: approval.id.clone(),
                            decision: crate::ApprovalDecision::Deny,
                        },
                    ]
                } else {
                    Vec::new()
                },
            },
            ContentPart::Elicitation(elicitation) => Self {
                label: "Input requested".into(),
                body: Some(if elicitation.choices.is_empty() {
                    elicitation.prompt.clone()
                } else {
                    format!(
                        "{}\n{}",
                        elicitation.prompt,
                        elicitation.choices.join(" · ")
                    )
                }),
                tone: StatusTone::Warning,
                actions: if matches!(elicitation.state, crate::ElicitationState::Pending) {
                    elicitation
                        .choices
                        .iter()
                        .cloned()
                        .map(|value| Action::Elicitation {
                            id: elicitation.id.clone(),
                            value,
                        })
                        .collect()
                } else {
                    Vec::new()
                },
            },
            ContentPart::AiEdit(edit) => Self {
                label: edit.path.clone(),
                body: Some(format_edit(edit)),
                tone: if edit.applied {
                    StatusTone::Positive
                } else {
                    StatusTone::Accent
                },
                actions: if edit.applied {
                    Vec::new()
                } else {
                    vec![
                        Action::Edit {
                            id: edit.id.clone(),
                            hunk: None,
                            apply: true,
                        },
                        Action::Edit {
                            id: edit.id.clone(),
                            hunk: None,
                            apply: false,
                        },
                    ]
                },
            },
            ContentPart::Citation(citation) => Self {
                label: citation.label.clone(),
                body: citation.excerpt.clone(),
                tone: StatusTone::Accent,
                actions: vec![Action::OpenCitation {
                    uri: citation.uri.clone(),
                }],
            },
            ContentPart::Artifact(artifact) => Self {
                label: artifact.title.clone(),
                body: Some(artifact.media_type.clone()),
                tone: StatusTone::Accent,
                actions: vec![Action::OpenArtifact {
                    id: artifact.id.clone(),
                }],
            },
        }
    }
}

fn format_edit(edit: &crate::AiEdit) -> String {
    let mut output = edit.summary.clone();
    for hunk in &edit.hunks {
        let _ = write!(output, "\n@@ -{} +{} @@", hunk.old_start, hunk.new_start);
        for line in &hunk.removed {
            let _ = write!(output, "\n-{line}");
        }
        for line in &hunk.added {
            let _ = write!(output, "\n+{line}");
        }
    }
    output
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MessageView {
    pub id: MessageId,
    pub heading: String,
    pub parts: Vec<PartView>,
    pub tone: StatusTone,
    pub actions: Vec<Action>,
    pub accessibility: Accessibility,
}
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ConversationView {
    pub messages: Vec<MessageView>,
    pub empty_message: Option<String>,
    pub actions: Vec<Action>,
    pub accessibility: Accessibility,
}

impl From<&Conversation> for ConversationView {
    fn from(conversation: &Conversation) -> Self {
        let busy = matches!(
            conversation.stream,
            StreamState::Connecting | StreamState::Streaming | StreamState::Cancelling
        );
        let messages = conversation
            .messages
            .iter()
            .map(|message| {
                let heading: String = match message.role {
                    Role::System => "System",
                    Role::User => "You",
                    Role::Assistant => "Assistant",
                    Role::Tool => "Tool",
                }
                .into();
                let tone = match message.status {
                    MessageStatus::Failed => StatusTone::Danger,
                    MessageStatus::Cancelled => StatusTone::Warning,
                    MessageStatus::Streaming => StatusTone::Accent,
                    _ => StatusTone::Neutral,
                };
                MessageView {
                    id: message.id.clone(),
                    heading: heading.clone(),
                    parts: message.parts.iter().map(PartView::from).collect(),
                    tone,
                    actions: if message.error.as_ref().is_some_and(|error| error.retryable) {
                        vec![Action::Retry]
                    } else {
                        vec![Action::Copy]
                    },
                    accessibility: Accessibility {
                        label: format!("{heading} message"),
                        description: message.error.as_ref().map(|error| error.message.clone()),
                        live_region: (message.status == MessageStatus::Streaming)
                            .then_some(LiveRegion::Polite),
                        busy: message.status == MessageStatus::Streaming,
                    },
                }
            })
            .collect();
        let mut actions = Vec::new();
        if conversation.can_cancel() {
            actions.push(Action::Cancel);
        }
        if conversation.can_retry() {
            actions.push(Action::Retry);
        }
        Self {
            messages,
            empty_message: conversation
                .messages
                .is_empty()
                .then(|| "Start a conversation".into()),
            actions,
            accessibility: Accessibility {
                label: "Conversation".into(),
                description: conversation
                    .error
                    .as_ref()
                    .map(|error| error.message.clone()),
                live_region: Some(LiveRegion::Polite),
                busy,
            },
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ComposerView {
    pub placeholder: String,
    pub attachment_labels: Vec<String>,
    pub actions: Vec<Action>,
    pub accessibility: Accessibility,
}
impl From<&Composer> for ComposerView {
    fn from(composer: &Composer) -> Self {
        Self {
            placeholder: "Ask anything".into(),
            attachment_labels: composer
                .attachments
                .iter()
                .map(|item| item.name.clone())
                .collect(),
            actions: if composer.can_submit() {
                vec![Action::Submit]
            } else {
                Vec::new()
            },
            accessibility: Accessibility {
                label: "Message composer".into(),
                description: None,
                live_region: None,
                busy: composer.state == ComposerState::Submitting,
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        ConversationEvent, ErrorInfo, ErrorKind, Message, ModelId, ProviderId, ProviderSelection,
    };
    #[test]
    fn streaming_view_is_busy_and_cancellable() {
        let mut c = Conversation::new("c");
        c.apply(ConversationEvent::StreamStarted).unwrap();
        let view = ConversationView::from(&c);
        assert!(view.accessibility.busy);
        assert_eq!(view.actions, vec![Action::Cancel]);
    }

    #[test]
    fn streaming_render_plan_uses_supported_status_semantics() {
        let mut conversation = Conversation::new("c");
        conversation
            .apply(ConversationEvent::StreamStarted)
            .unwrap();
        let component = crate::AgentConversation::new("conversation", conversation);

        assert_eq!(
            component.render_plan(),
            crate::ConversationRenderPlan {
                description: "Response in progress",
                status_announcement: Some("Response in progress"),
            }
        );
    }

    #[test]
    fn composer_render_plan_reports_queue_status() {
        let mut composer = Composer::new(ProviderSelection {
            provider: ProviderId("p".into()),
            model: ModelId("m".into()),
        });
        composer.text = "queued".into();
        composer.queue_current().unwrap();
        let component = crate::AgentComposer::new("composer", composer);

        assert_eq!(
            component.render_plan(),
            crate::ComposerRenderPlan {
                queued_prompt_count: 1,
                queue_status_label: Some("1 queued prompts".into()),
            }
        );
    }
    #[test]
    fn retryable_failure_exposes_retry() {
        let mut m = Message::new("m", Role::Assistant);
        m.status = MessageStatus::Failed;
        m.error = Some(ErrorInfo {
            kind: ErrorKind::Provider,
            message: "again".into(),
            retryable: true,
        });
        let mut c = Conversation::new("c");
        c.messages.push(m);
        let view = ConversationView::from(&c);
        assert_eq!(view.messages[0].tone, StatusTone::Danger);
        assert_eq!(view.messages[0].actions, vec![Action::Retry]);
    }
    #[test]
    fn valid_composer_exposes_submit() {
        let mut c = Composer::new(ProviderSelection {
            provider: ProviderId("p".into()),
            model: ModelId("m".into()),
        });
        assert!(ComposerView::from(&c).actions.is_empty());
        c.text = "hello".into();
        assert_eq!(ComposerView::from(&c).actions, vec![Action::Submit]);
    }
    #[test]
    fn elicitation_and_edit_expose_actions_and_diff() {
        let elicitation = PartView::from(&ContentPart::Elicitation(crate::Elicitation {
            id: crate::ElicitationId("e".into()),
            prompt: "Pick".into(),
            kind: crate::ElicitationKind::Choice,
            choices: vec!["A".into(), "B".into()],
            state: crate::ElicitationState::Pending,
        }));
        assert!(
            matches!(&elicitation.actions[0], Action::Elicitation { value, .. } if value == "A")
        );
        assert!(elicitation.body.unwrap().contains("A · B"));
        let edit = PartView::from(&ContentPart::AiEdit(crate::AiEdit {
            id: crate::EditId("edit".into()),
            path: "a.rs".into(),
            summary: "Change".into(),
            hunks: vec![crate::DiffHunk {
                old_start: 1,
                new_start: 2,
                removed: vec!["old".into()],
                added: vec!["new".into()],
            }],
            applied: false,
        }));
        assert!(matches!(&edit.actions[0], Action::Edit { apply: true, .. }));
        assert!(edit.body.unwrap().contains("-old\n+new"));
    }
}
