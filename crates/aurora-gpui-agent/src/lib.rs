//! Application-neutral conversation models for Aurora GPUI clients.
//!
//! Hosts normalize provider events into [`ConversationEvent`] values, apply
//! them to a [`Conversation`], and render the resulting [`ConversationView`].

mod composer;
mod conversation;
mod provider;
mod render;
mod view;

pub use composer::{
    Attachment, AttachmentId, AttachmentKind, Composer, ComposerError, ComposerState, Mention,
    MentionId, QueuedPrompt, SelectionOption, Submission,
};
pub use conversation::{
    AiEdit, Approval, ApprovalDecision, ApprovalId, ApprovalState, Artifact, ArtifactId, Citation,
    ContentPart, Conversation, ConversationError, ConversationEvent, ConversationId, DiffHunk,
    EditId, Elicitation, ElicitationId, ElicitationKind, ElicitationState, ErrorInfo, ErrorKind,
    Message, MessageId, MessageStatus, Role, StreamState, ToolCall, ToolCallId, ToolCallState,
    ToolResult,
};
pub use provider::{
    Capability, Command, CommandId, Model, ModelId, Provider, ProviderCatalog, ProviderId,
    ProviderSelection, SelectionError,
};
pub use render::{
    AgentComposer, AgentConversation, AgentMessage, AgentPart, ComposerRenderPlan,
    ConversationRenderPlan, ModelSelector, is_activation_key,
};
pub use view::{
    Accessibility, Action, Announcement, ComposerView, ConversationView, LiveRegion, MessageView,
    PartView, StatusTone,
};
