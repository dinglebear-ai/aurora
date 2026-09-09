use std::fmt;

#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub struct ConversationId(pub String);
#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub struct MessageId(pub String);
#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub struct ToolCallId(pub String);
#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub struct ApprovalId(pub String);
#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub struct ElicitationId(pub String);
#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub struct ArtifactId(pub String);
#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub struct EditId(pub String);

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Role {
    System,
    User,
    Assistant,
    Tool,
}
#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub enum StreamState {
    #[default]
    Idle,
    Connecting,
    Streaming,
    Cancelling,
    Completed,
    Failed,
    Cancelled,
}
#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub enum MessageStatus {
    #[default]
    Pending,
    Streaming,
    Complete,
    Failed,
    Cancelled,
}
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ErrorKind {
    Network,
    Authentication,
    RateLimited,
    Provider,
    Cancelled,
    Unknown,
}
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ErrorInfo {
    pub kind: ErrorKind,
    pub message: String,
    pub retryable: bool,
}
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Citation {
    pub label: String,
    pub uri: String,
    pub excerpt: Option<String>,
}
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Artifact {
    pub id: ArtifactId,
    pub title: String,
    pub media_type: String,
    pub uri: String,
}
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ToolResult {
    pub summary: String,
    pub content: Option<String>,
    pub is_error: bool,
}
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ToolCallState {
    Pending,
    Running,
    Complete(ToolResult),
    Failed(ErrorInfo),
    Cancelled,
}
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ToolCall {
    pub id: ToolCallId,
    pub name: String,
    pub arguments: String,
    pub state: ToolCallState,
}
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ApprovalDecision {
    Approve,
    Deny,
}
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ApprovalState {
    Pending,
    Resolved(ApprovalDecision),
    Expired,
}
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Approval {
    pub id: ApprovalId,
    pub title: String,
    pub description: String,
    pub state: ApprovalState,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ElicitationKind {
    Text,
    Choice,
    Confirmation,
}
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ElicitationState {
    Pending,
    Answered(String),
    Dismissed,
}
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Elicitation {
    pub id: ElicitationId,
    pub prompt: String,
    pub kind: ElicitationKind,
    pub choices: Vec<String>,
    pub state: ElicitationState,
}
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DiffHunk {
    pub old_start: u32,
    pub new_start: u32,
    pub removed: Vec<String>,
    pub added: Vec<String>,
}
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AiEdit {
    pub id: EditId,
    pub path: String,
    pub summary: String,
    pub hunks: Vec<DiffHunk>,
    pub applied: bool,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ContentPart {
    Text(String),
    Reasoning(String),
    Code {
        language: Option<String>,
        code: String,
    },
    ToolCall(ToolCall),
    Approval(Approval),
    Elicitation(Elicitation),
    AiEdit(AiEdit),
    Citation(Citation),
    Artifact(Artifact),
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Message {
    pub id: MessageId,
    pub role: Role,
    pub parts: Vec<ContentPart>,
    pub status: MessageStatus,
    pub error: Option<ErrorInfo>,
}
impl Message {
    pub fn new(id: impl Into<String>, role: Role) -> Self {
        Self {
            id: MessageId(id.into()),
            role,
            parts: Vec::new(),
            status: MessageStatus::Pending,
            error: None,
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ConversationEvent {
    StreamStarted,
    MessageAdded(Message),
    TextDelta {
        message: MessageId,
        text: String,
    },
    PartAdded {
        message: MessageId,
        part: ContentPart,
    },
    ToolStateChanged {
        message: MessageId,
        call: ToolCallId,
        state: ToolCallState,
    },
    ApprovalResolved {
        message: MessageId,
        approval: ApprovalId,
        decision: ApprovalDecision,
    },
    MessageCompleted(MessageId),
    MessageFailed {
        message: MessageId,
        error: ErrorInfo,
    },
    StreamCompleted,
    StreamCancelling,
    StreamCancelled,
    StreamFailed(ErrorInfo),
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Conversation {
    pub id: ConversationId,
    pub messages: Vec<Message>,
    pub stream: StreamState,
    pub error: Option<ErrorInfo>,
}
impl Conversation {
    pub fn new(id: impl Into<String>) -> Self {
        Self {
            id: ConversationId(id.into()),
            messages: Vec::new(),
            stream: StreamState::Idle,
            error: None,
        }
    }
    pub fn can_cancel(&self) -> bool {
        matches!(
            self.stream,
            StreamState::Connecting | StreamState::Streaming
        )
    }
    pub fn can_retry(&self) -> bool {
        self.error.as_ref().is_some_and(|error| error.retryable)
            || self
                .messages
                .last()
                .and_then(|message| message.error.as_ref())
                .is_some_and(|error| error.retryable)
    }
    /// Applies one normalized provider event.
    ///
    /// # Errors
    /// Returns [`ConversationError`] when an event refers to an unknown or
    /// already-resolved entity.
    pub fn apply(&mut self, event: ConversationEvent) -> Result<(), ConversationError> {
        match event {
            ConversationEvent::StreamStarted => {
                self.stream = StreamState::Streaming;
                self.error = None;
            }
            ConversationEvent::MessageAdded(message) => {
                if self.messages.iter().any(|item| item.id == message.id) {
                    return Err(ConversationError::DuplicateMessage(message.id));
                }
                self.messages.push(message);
            }
            ConversationEvent::TextDelta { message, text } => {
                let target = self.message_mut(&message)?;
                target.status = MessageStatus::Streaming;
                match target.parts.last_mut() {
                    Some(ContentPart::Text(current)) => current.push_str(&text),
                    _ => target.parts.push(ContentPart::Text(text)),
                }
            }
            ConversationEvent::PartAdded { message, part } => {
                self.message_mut(&message)?.parts.push(part);
            }
            ConversationEvent::ToolStateChanged {
                message,
                call,
                state,
            } => {
                let target = self.message_mut(&message)?;
                let Some(tool) = target.parts.iter_mut().find_map(|part| match part {
                    ContentPart::ToolCall(tool) if tool.id == call => Some(tool),
                    _ => None,
                }) else {
                    return Err(ConversationError::UnknownToolCall(call));
                };
                tool.state = state;
            }
            ConversationEvent::ApprovalResolved {
                message,
                approval,
                decision,
            } => {
                let target = self.message_mut(&message)?;
                let Some(request) = target.parts.iter_mut().find_map(|part| match part {
                    ContentPart::Approval(request) if request.id == approval => Some(request),
                    _ => None,
                }) else {
                    return Err(ConversationError::UnknownApproval(approval));
                };
                if request.state != ApprovalState::Pending {
                    return Err(ConversationError::ApprovalAlreadyResolved(approval));
                }
                request.state = ApprovalState::Resolved(decision);
            }
            ConversationEvent::MessageCompleted(id) => {
                self.message_mut(&id)?.status = MessageStatus::Complete;
            }
            ConversationEvent::MessageFailed { message, error } => {
                let target = self.message_mut(&message)?;
                target.status = MessageStatus::Failed;
                target.error = Some(error);
            }
            ConversationEvent::StreamCompleted => self.stream = StreamState::Completed,
            ConversationEvent::StreamCancelling => self.stream = StreamState::Cancelling,
            ConversationEvent::StreamCancelled => self.stream = StreamState::Cancelled,
            ConversationEvent::StreamFailed(error) => {
                self.stream = StreamState::Failed;
                self.error = Some(error);
            }
        }
        Ok(())
    }
    fn message_mut(&mut self, id: &MessageId) -> Result<&mut Message, ConversationError> {
        self.messages
            .iter_mut()
            .find(|item| item.id == *id)
            .ok_or_else(|| ConversationError::UnknownMessage(id.clone()))
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ConversationError {
    DuplicateMessage(MessageId),
    UnknownMessage(MessageId),
    UnknownToolCall(ToolCallId),
    UnknownApproval(ApprovalId),
    ApprovalAlreadyResolved(ApprovalId),
}
impl fmt::Display for ConversationError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "invalid conversation event: {self:?}")
    }
}
impl std::error::Error for ConversationError {}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn deltas_coalesce_and_complete() {
        let mut c = Conversation::new("chat");
        c.apply(ConversationEvent::StreamStarted).unwrap();
        c.apply(ConversationEvent::MessageAdded(Message::new(
            "m",
            Role::Assistant,
        )))
        .unwrap();
        for text in ["Hel", "lo"] {
            c.apply(ConversationEvent::TextDelta {
                message: MessageId("m".into()),
                text: text.into(),
            })
            .unwrap();
        }
        c.apply(ConversationEvent::MessageCompleted(MessageId("m".into())))
            .unwrap();
        assert_eq!(c.messages[0].parts, vec![ContentPart::Text("Hello".into())]);
        assert_eq!(c.messages[0].status, MessageStatus::Complete);
    }
    #[test]
    fn tools_and_approvals_update_by_identity() {
        let mut m = Message::new("m", Role::Assistant);
        m.parts.push(ContentPart::ToolCall(ToolCall {
            id: ToolCallId("t".into()),
            name: "search".into(),
            arguments: "{}".into(),
            state: ToolCallState::Pending,
        }));
        m.parts.push(ContentPart::Approval(Approval {
            id: ApprovalId("a".into()),
            title: "Run".into(),
            description: "Search".into(),
            state: ApprovalState::Pending,
        }));
        let mut c = Conversation::new("c");
        c.apply(ConversationEvent::MessageAdded(m)).unwrap();
        c.apply(ConversationEvent::ToolStateChanged {
            message: MessageId("m".into()),
            call: ToolCallId("t".into()),
            state: ToolCallState::Running,
        })
        .unwrap();
        c.apply(ConversationEvent::ApprovalResolved {
            message: MessageId("m".into()),
            approval: ApprovalId("a".into()),
            decision: ApprovalDecision::Approve,
        })
        .unwrap();
        assert!(matches!(
            &c.messages[0].parts[0],
            ContentPart::ToolCall(ToolCall {
                state: ToolCallState::Running,
                ..
            })
        ));
    }
    #[test]
    fn invalid_identity_is_rejected() {
        let mut c = Conversation::new("c");
        c.apply(ConversationEvent::MessageAdded(Message::new(
            "m",
            Role::User,
        )))
        .unwrap();
        assert!(matches!(
            c.apply(ConversationEvent::MessageAdded(Message::new(
                "m",
                Role::User
            ))),
            Err(ConversationError::DuplicateMessage(_))
        ));
        assert!(matches!(
            c.apply(ConversationEvent::MessageCompleted(MessageId("x".into()))),
            Err(ConversationError::UnknownMessage(_))
        ));
    }
    #[test]
    fn retry_and_cancel_are_derived() {
        let mut c = Conversation::new("c");
        c.stream = StreamState::Connecting;
        assert!(c.can_cancel());
        c.apply(ConversationEvent::StreamFailed(ErrorInfo {
            kind: ErrorKind::Network,
            message: "offline".into(),
            retryable: true,
        }))
        .unwrap();
        assert!(c.can_retry());
        assert!(!c.can_cancel());
    }
}
