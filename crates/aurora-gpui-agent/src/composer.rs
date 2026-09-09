use crate::{
    Capability, Command, CommandId, ModelId, Provider, ProviderId, ProviderSelection,
    SelectionError,
};
use std::{collections::BTreeSet, fmt};

#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub struct MentionId(pub String);
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Mention {
    pub id: MentionId,
    pub label: String,
    pub target: String,
}
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct QueuedPrompt {
    pub text: String,
    pub attachments: Vec<Attachment>,
    pub mentions: Vec<Mention>,
    pub required_capabilities: BTreeSet<Capability>,
}
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Submission {
    pub prompt: QueuedPrompt,
    pub selection: ProviderSelection,
}

#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub struct AttachmentId(pub String);
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum AttachmentKind {
    File,
    Image,
    Context,
}
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Attachment {
    pub id: AttachmentId,
    pub name: String,
    pub kind: AttachmentKind,
    pub media_type: Option<String>,
    pub byte_len: Option<u64>,
}
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SelectionOption<T> {
    pub value: T,
    pub label: String,
    pub description: Option<String>,
    pub disabled: bool,
}
#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub enum ComposerState {
    #[default]
    Ready,
    Submitting,
    Disabled,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Composer {
    pub text: String,
    pub attachments: Vec<Attachment>,
    pub mentions: Vec<Mention>,
    pub queue: Vec<QueuedPrompt>,
    pub required_capabilities: BTreeSet<Capability>,
    pub selection: ProviderSelection,
    pub commands: Vec<Command>,
    pub state: ComposerState,
}
impl Composer {
    pub fn new(selection: ProviderSelection) -> Self {
        Self {
            text: String::new(),
            attachments: Vec::new(),
            mentions: Vec::new(),
            queue: Vec::new(),
            required_capabilities: BTreeSet::new(),
            selection,
            commands: Vec::new(),
            state: ComposerState::Ready,
        }
    }
    pub fn can_submit(&self) -> bool {
        self.state == ComposerState::Ready
            && (!self.text.trim().is_empty() || !self.attachments.is_empty())
    }
    /// Begins submission.
    ///
    /// # Errors
    /// Returns [`ComposerError::Empty`] without content, or `Unavailable` when
    /// the composer is already submitting or disabled.
    pub fn submit(&mut self) -> Result<(), ComposerError> {
        if self.state != ComposerState::Ready {
            return Err(ComposerError::Unavailable(self.state));
        }
        if self.text.trim().is_empty() && self.attachments.is_empty() {
            return Err(ComposerError::Empty);
        }
        self.state = ComposerState::Submitting;
        Ok(())
    }
    pub fn remove_attachment(&mut self, id: &AttachmentId) -> bool {
        let len = self.attachments.len();
        self.attachments.retain(|item| item.id != *id);
        self.attachments.len() != len
    }
    /// Creates a validated immutable submission.
    ///
    /// # Errors
    /// Returns an error for invalid content, selection, or model capability.
    pub fn prepare_submission(&self, providers: &[Provider]) -> Result<Submission, ComposerError> {
        if !self.can_submit() {
            return Err(ComposerError::EmptyOrUnavailable);
        }
        let mut required = self.required_capabilities.clone();
        if !self.attachments.is_empty() {
            required.insert(Capability::Attachments);
        }
        if self
            .attachments
            .iter()
            .any(|item| item.kind == AttachmentKind::Image)
        {
            required.insert(Capability::Images);
        }
        self.selection
            .validate(providers, &required)
            .map_err(ComposerError::Selection)?;
        Ok(Submission {
            prompt: QueuedPrompt {
                text: self.text.clone(),
                attachments: self.attachments.clone(),
                mentions: self.mentions.clone(),
                required_capabilities: required,
            },
            selection: self.selection.clone(),
        })
    }
    /// Moves the current prompt into the local send queue.
    ///
    /// # Errors
    /// Returns [`ComposerError::Empty`] when there is no content.
    pub fn queue_current(&mut self) -> Result<(), ComposerError> {
        if self.text.trim().is_empty() && self.attachments.is_empty() {
            return Err(ComposerError::Empty);
        }
        self.queue.push(QueuedPrompt {
            text: std::mem::take(&mut self.text),
            attachments: std::mem::take(&mut self.attachments),
            mentions: std::mem::take(&mut self.mentions),
            required_capabilities: self.required_capabilities.clone(),
        });
        Ok(())
    }
    pub fn require_capability(&mut self, capability: Capability) {
        self.required_capabilities.insert(capability);
    }
    pub fn select_provider_model(&mut self, provider: ProviderId, model: ModelId) {
        self.selection = ProviderSelection { provider, model };
    }
    pub fn command(&self, id: &CommandId) -> Option<&Command> {
        self.commands.iter().find(|item| item.id == *id)
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ComposerError {
    Empty,
    EmptyOrUnavailable,
    Unavailable(ComposerState),
    Selection(SelectionError),
}
impl fmt::Display for ComposerError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Empty => f.write_str("a prompt or attachment is required"),
            Self::EmptyOrUnavailable => f.write_str("composer cannot submit"),
            Self::Unavailable(state) => write!(f, "composer is unavailable: {state:?}"),
            Self::Selection(error) => error.fmt(f),
        }
    }
}
impl std::error::Error for ComposerError {}

#[cfg(test)]
mod tests {
    use super::*;
    fn composer() -> Composer {
        Composer::new(ProviderSelection {
            provider: ProviderId("p".into()),
            model: ModelId("m".into()),
        })
    }
    #[test]
    fn empty_prompt_fails() {
        let mut c = composer();
        c.text = " \n".into();
        assert_eq!(c.submit(), Err(ComposerError::Empty));
    }
    #[test]
    fn attachment_only_prompt_submits_and_removes() {
        let mut c = composer();
        c.attachments.push(Attachment {
            id: AttachmentId("a".into()),
            name: "x.rs".into(),
            kind: AttachmentKind::File,
            media_type: None,
            byte_len: Some(1),
        });
        assert!(c.can_submit());
        assert_eq!(c.submit(), Ok(()));
        assert!(c.remove_attachment(&AttachmentId("a".into())));
    }
    #[test]
    fn submission_rejects_arbitrary_selection_and_missing_capability() {
        let mut c = composer();
        c.attachments.push(Attachment {
            id: AttachmentId("image".into()),
            name: "image.png".into(),
            kind: AttachmentKind::Image,
            media_type: Some("image/png".into()),
            byte_len: Some(2),
        });
        let providers = vec![Provider::new(
            "p",
            "Provider",
            vec![crate::Model::new("m", "Model")],
        )];
        assert!(matches!(
            c.prepare_submission(&providers),
            Err(ComposerError::Selection(
                SelectionError::MissingCapability { .. }
            ))
        ));
        c.selection.model = ModelId("invented".into());
        assert!(matches!(
            c.prepare_submission(&providers),
            Err(ComposerError::Selection(
                SelectionError::UnknownModel { .. }
            ))
        ));
    }
    #[test]
    fn queue_preserves_mentions_and_attachments() {
        let mut c = composer();
        c.text = "Explain".into();
        c.mentions.push(Mention {
            id: MentionId("file".into()),
            label: "lib.rs".into(),
            target: "src/lib.rs".into(),
        });
        c.queue_current().unwrap();
        assert_eq!(c.queue[0].mentions[0].target, "src/lib.rs");
        assert!(c.text.is_empty());
        assert!(c.queue[0].required_capabilities.is_empty());
    }
    #[test]
    fn declared_operation_capabilities_are_enforced() {
        let mut c = composer();
        c.text = "Use a tool".into();
        c.require_capability(Capability::Tools);
        let providers = vec![Provider::new(
            "p",
            "Provider",
            vec![crate::Model::new("m", "Model")],
        )];
        assert!(matches!(
            c.prepare_submission(&providers),
            Err(ComposerError::Selection(
                SelectionError::MissingCapability {
                    capability: Capability::Tools,
                    ..
                }
            ))
        ));
    }
}
