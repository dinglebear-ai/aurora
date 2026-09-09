//! Token-backed GPUI elements for the provider-neutral state models.

use std::rc::Rc;

use aurora_gpui_core::AuroraTheme;
use gpui::{
    AccessibleAction, App, ClickEvent, ElementId, IntoElement, KeyDownEvent, RenderOnce,
    Role as AccessibleRole, SharedString, Window, div, prelude::*, px, rems,
};

use crate::{
    Action, Composer, ContentPart, Conversation, Message, Model, Provider, ProviderCatalog,
    ProviderSelection, StatusTone,
};

type ActionHandler = Rc<dyn Fn(Action, &ClickEvent, &mut Window, &mut App)>;
type SelectionHandler = Rc<dyn Fn(ProviderSelection, &ClickEvent, &mut Window, &mut App)>;
type InputHandler = Rc<dyn Fn(&KeyDownEvent, &mut Window, &mut App)>;
type TextHandler = Rc<dyn Fn(String, &mut Window, &mut App)>;

/// Deterministic accessibility state emitted by [`AgentConversation`].
///
/// GPUI currently exposes AccessKit roles and accessible descriptions, but no
/// explicit `aria-busy`/live-region setters. A `Status` node supplies the
/// supported live-update semantic while the description exposes busy state.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ConversationRenderPlan {
    pub description: &'static str,
    pub status_announcement: Option<&'static str>,
}

/// Deterministic queue state emitted by [`AgentComposer`].
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ComposerRenderPlan {
    pub queued_prompt_count: usize,
    pub queue_status_label: Option<String>,
}

fn tone_color(tone: StatusTone, theme: &AuroraTheme) -> gpui::Hsla {
    match tone {
        StatusTone::Neutral => theme.colors.text_muted,
        StatusTone::Accent => theme.colors.primary,
        StatusTone::Positive => theme.colors.success,
        StatusTone::Warning => theme.colors.warning,
        StatusTone::Danger => theme.colors.danger,
    }
    .into()
}

fn action_button(
    id: impl Into<ElementId>,
    label: &'static str,
    action: Action,
    theme: AuroraTheme,
    handler: Option<ActionHandler>,
) -> impl IntoElement {
    let mut button = div()
        .id(id)
        .role(AccessibleRole::Button)
        .tab_index(0)
        .aria_label(label)
        .cursor_pointer()
        .px(px(theme.space.sm))
        .py(px(theme.space.xs))
        .rounded(px(theme.radii.sm))
        .bg(gpui::Hsla::from(theme.colors.surface_active))
        .text_color(theme.colors.text)
        .child(label);
    if let Some(handler) = handler {
        let click_handler = handler.clone();
        let click_action = action.clone();
        button = button
            .on_click(move |event, window, cx| {
                click_handler(click_action.clone(), event, window, cx);
            })
            .on_key_down({
                let handler = handler.clone();
                let action = action.clone();
                move |event, window, cx| {
                    if is_activation_key(event) {
                        handler(action.clone(), &ClickEvent::default(), window, cx);
                    }
                }
            })
            .on_a11y_action(AccessibleAction::Click, move |_, window, cx| {
                handler(action.clone(), &ClickEvent::default(), window, cx);
            });
    }
    button
}

/// A content-part card with semantic actions.
#[derive(IntoElement)]
pub struct AgentPart {
    id: ElementId,
    part: ContentPart,
    theme: AuroraTheme,
    on_action: Option<ActionHandler>,
}

impl AgentPart {
    pub fn new(id: impl Into<ElementId>, part: ContentPart) -> Self {
        Self {
            id: id.into(),
            part,
            theme: AuroraTheme::default(),
            on_action: None,
        }
    }
    #[must_use]
    pub const fn theme(mut self, theme: AuroraTheme) -> Self {
        self.theme = theme;
        self
    }
    #[must_use]
    pub fn on_action(
        mut self,
        handler: impl Fn(Action, &ClickEvent, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_action = Some(Rc::new(handler));
        self
    }
}

impl RenderOnce for AgentPart {
    fn render(self, _: &mut Window, _: &mut App) -> impl IntoElement {
        let view = crate::PartView::from(&self.part);
        let mut element = div()
            .id(self.id)
            .role(AccessibleRole::Group)
            .aria_label(view.label.clone())
            .flex()
            .flex_col()
            .gap(px(self.theme.space.xs))
            .p(px(self.theme.space.sm))
            .rounded(px(self.theme.radii.md))
            .border_1()
            .border_color(tone_color(view.tone, &self.theme))
            .bg(gpui::Hsla::from(self.theme.colors.surface));
        element = element.child(div().text_color(self.theme.colors.text).child(view.label));
        if let Some(body) = view.body {
            element = element.child(div().text_color(self.theme.colors.text_muted).child(body));
        }
        let actions = view
            .actions
            .into_iter()
            .enumerate()
            .map(|(index, action)| {
                let label = action_label(&action);
                action_button(
                    ElementId::Name(format!("part-action-{index}").into()),
                    label,
                    action,
                    self.theme,
                    self.on_action.clone(),
                )
            })
            .collect::<Vec<_>>();
        element.children(actions)
    }
}

/// A message and its ordered content parts.
#[derive(IntoElement)]
pub struct AgentMessage {
    id: ElementId,
    message: Message,
    theme: AuroraTheme,
    on_action: Option<ActionHandler>,
}
impl AgentMessage {
    pub fn new(id: impl Into<ElementId>, message: Message) -> Self {
        Self {
            id: id.into(),
            message,
            theme: AuroraTheme::default(),
            on_action: None,
        }
    }
    #[must_use]
    pub const fn theme(mut self, theme: AuroraTheme) -> Self {
        self.theme = theme;
        self
    }
    #[must_use]
    pub fn on_action(
        mut self,
        handler: impl Fn(Action, &ClickEvent, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_action = Some(Rc::new(handler));
        self
    }
}
impl RenderOnce for AgentMessage {
    fn render(self, _: &mut Window, _: &mut App) -> impl IntoElement {
        let heading = match self.message.role {
            crate::Role::System => "System",
            crate::Role::User => "You",
            crate::Role::Assistant => "Assistant",
            crate::Role::Tool => "Tool",
        };
        let streaming = self.message.status == crate::MessageStatus::Streaming;
        let theme = self.theme;
        let handler = self.on_action;
        div()
            .id(self.id)
            .role(AccessibleRole::ListItem)
            .aria_label(format!("{heading} message"))
            .aria_description(if streaming {
                "Streaming response"
            } else {
                "Message"
            })
            .flex()
            .flex_col()
            .gap(px(theme.space.sm))
            .p(px(theme.space.md))
            .rounded(px(theme.radii.lg))
            .bg(gpui::Hsla::from(theme.colors.surface))
            .child(
                div()
                    .text_size(rems(0.75))
                    .text_color(theme.colors.text_muted)
                    .child(heading),
            )
            .children(
                self.message
                    .parts
                    .into_iter()
                    .enumerate()
                    .map(move |(index, part)| {
                        let mut component = AgentPart::new(
                            ElementId::Name(format!("message-part-{index}").into()),
                            part,
                        )
                        .theme(theme);
                        if let Some(callback) = handler.clone() {
                            component = component.on_action(move |action, event, window, cx| {
                                callback(action, event, window, cx);
                            });
                        }
                        component
                    }),
            )
    }
}

/// A scrollable conversation timeline with retry and cancellation actions.
#[derive(IntoElement)]
pub struct AgentConversation {
    id: ElementId,
    conversation: Conversation,
    theme: AuroraTheme,
    on_action: Option<ActionHandler>,
}
impl AgentConversation {
    pub fn new(id: impl Into<ElementId>, conversation: Conversation) -> Self {
        Self {
            id: id.into(),
            conversation,
            theme: AuroraTheme::default(),
            on_action: None,
        }
    }
    #[must_use]
    pub const fn theme(mut self, theme: AuroraTheme) -> Self {
        self.theme = theme;
        self
    }
    #[must_use]
    pub fn on_action(
        mut self,
        handler: impl Fn(Action, &ClickEvent, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_action = Some(Rc::new(handler));
        self
    }

    #[must_use]
    pub fn render_plan(&self) -> ConversationRenderPlan {
        let busy = crate::ConversationView::from(&self.conversation)
            .accessibility
            .busy;
        ConversationRenderPlan {
            description: if busy {
                "Response in progress"
            } else {
                "Conversation messages"
            },
            status_announcement: busy.then_some("Response in progress"),
        }
    }
}
impl RenderOnce for AgentConversation {
    fn render(self, _: &mut Window, _: &mut App) -> impl IntoElement {
        let view = crate::ConversationView::from(&self.conversation);
        let plan = self.render_plan();
        let theme = self.theme;
        let handler = self.on_action;
        let mut list = div()
            .id(self.id)
            .role(AccessibleRole::List)
            .aria_label("Conversation")
            .aria_description(plan.description)
            .flex()
            .flex_col()
            .gap(px(theme.space.md))
            .p(px(theme.space.md))
            .bg(gpui::Hsla::from(theme.colors.background));
        if let Some(announcement) = plan.status_announcement {
            list = list.child(
                div()
                    .id("conversation-stream-status")
                    .role(AccessibleRole::Status)
                    .aria_label(announcement)
                    .child(announcement),
            );
        }
        if let Some(empty) = view.empty_message {
            list = list.child(
                div()
                    .id("conversation-empty")
                    .role(AccessibleRole::Status)
                    .aria_label(empty.clone())
                    .text_color(theme.colors.text_muted)
                    .child(empty),
            );
        }
        list = list.children(self.conversation.messages.into_iter().enumerate().map({
            let handler = handler.clone();
            move |(index, message)| {
                let mut component = AgentMessage::new(
                    ElementId::Name(format!("agent-message-{index}").into()),
                    message,
                )
                .theme(theme);
                if let Some(callback) = handler.clone() {
                    component = component.on_action(move |action, event, window, cx| {
                        callback(action, event, window, cx);
                    });
                }
                component
            }
        }));
        list.children(
            view.actions
                .into_iter()
                .enumerate()
                .map(move |(index, action)| {
                    action_button(
                        ElementId::Name(format!("conversation-action-{index}").into()),
                        action_label(&action),
                        action,
                        theme,
                        handler.clone(),
                    )
                }),
        )
    }
}

/// A composer surface with attachment, mention, queue, and submit affordances.
#[derive(IntoElement)]
pub struct AgentComposer {
    id: ElementId,
    composer: Composer,
    theme: AuroraTheme,
    on_action: Option<ActionHandler>,
    on_input_key: Option<InputHandler>,
    on_replace_text: Option<TextHandler>,
}
impl AgentComposer {
    pub fn new(id: impl Into<ElementId>, composer: Composer) -> Self {
        Self {
            id: id.into(),
            composer,
            theme: AuroraTheme::default(),
            on_action: None,
            on_input_key: None,
            on_replace_text: None,
        }
    }
    #[must_use]
    pub const fn theme(mut self, theme: AuroraTheme) -> Self {
        self.theme = theme;
        self
    }
    #[must_use]
    pub fn on_action(
        mut self,
        handler: impl Fn(Action, &ClickEvent, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_action = Some(Rc::new(handler));
        self
    }
    /// Registers the host editor/key adapter for composer input.
    #[must_use]
    pub fn on_input_key(
        mut self,
        handler: impl Fn(&KeyDownEvent, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_input_key = Some(Rc::new(handler));
        self
    }
    /// Registers replacement text supplied by assistive technology.
    #[must_use]
    pub fn on_replace_text(
        mut self,
        handler: impl Fn(String, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_replace_text = Some(Rc::new(handler));
        self
    }

    #[must_use]
    pub fn render_plan(&self) -> ComposerRenderPlan {
        let queued_prompt_count = self.composer.queue.len();
        ComposerRenderPlan {
            queued_prompt_count,
            queue_status_label: (queued_prompt_count > 0)
                .then(|| format!("{queued_prompt_count} queued prompts")),
        }
    }
}
impl RenderOnce for AgentComposer {
    #[allow(clippy::too_many_lines)]
    fn render(self, _: &mut Window, _: &mut App) -> impl IntoElement {
        let plan = self.render_plan();
        let valid = self.composer.can_submit();
        let busy = self.composer.state == crate::ComposerState::Submitting;
        let theme = self.theme;
        let mut root = div()
            .id(self.id)
            .role(AccessibleRole::TextInput)
            .focusable()
            .tab_index(0)
            .aria_label("Message composer")
            .aria_placeholder("Ask anything")
            .aria_value(self.composer.text.clone())
            .aria_description(if busy { "Submitting" } else { "Ready" })
            .flex()
            .flex_col()
            .gap(px(theme.space.sm))
            .p(px(theme.space.md))
            .border_1()
            .border_color(if valid {
                theme.colors.border_focused
            } else {
                theme.colors.border
            })
            .rounded(px(theme.radii.lg))
            .bg(gpui::Hsla::from(theme.colors.surface));
        if let Some(handler) = self.on_input_key {
            root = root.on_key_down(move |event, window, cx| handler(event, window, cx));
        }
        if let Some(handler) = self.on_replace_text {
            root = root.on_a11y_action(
                AccessibleAction::ReplaceSelectedText,
                move |data, window, cx| {
                    if let Some(gpui::accesskit::ActionData::Value(value)) = data {
                        handler(value.to_string(), window, cx);
                    }
                },
            );
        }
        root = root.child(if self.composer.text.is_empty() {
            SharedString::from("Ask anything")
        } else {
            SharedString::from(self.composer.text.clone())
        });
        root = root.children(self.composer.mentions.into_iter().map(|mention| {
            div()
                .id(ElementId::Name(format!("mention-{}", mention.id.0).into()))
                .role(AccessibleRole::Label)
                .aria_label(format!("Mention {}", mention.label))
                .text_color(theme.colors.primary)
                .child(format!("@{}", mention.label))
        }));
        root = root.children(self.composer.attachments.into_iter().enumerate().map(
            |(index, item)| {
                let callback = self.on_action.clone();
                let action = Action::RemoveAttachment {
                    id: item.id.clone(),
                };
                let mut attachment = div()
                    .id(ElementId::Name(format!("attachment-{index}").into()))
                    .role(AccessibleRole::Button)
                    .tab_index(0)
                    .aria_label(format!("Remove attachment {}", item.name));
                if let Some(handler) = callback {
                    let click_handler = handler.clone();
                    let click_action = action.clone();
                    attachment = attachment
                        .on_click(move |event, window, cx| {
                            click_handler(click_action.clone(), event, window, cx);
                        })
                        .on_key_down({
                            let handler = handler.clone();
                            let action = action.clone();
                            move |event, window, cx| {
                                if is_activation_key(event) {
                                    handler(action.clone(), &ClickEvent::default(), window, cx);
                                }
                            }
                        })
                        .on_a11y_action(AccessibleAction::Click, move |_, window, cx| {
                            handler(action.clone(), &ClickEvent::default(), window, cx);
                        });
                }
                attachment.child(item.name)
            },
        ));
        if let Some(queue_status_label) = plan.queue_status_label {
            root = root.child(
                div()
                    .id("composer-queue-status")
                    .role(AccessibleRole::Status)
                    .aria_label(queue_status_label)
                    .child(format!("Queued: {}", plan.queued_prompt_count)),
            );
        }
        if valid {
            root = root.child(action_button(
                "composer-submit",
                "Submit",
                Action::Submit,
                theme,
                self.on_action,
            ));
        }
        root
    }
}

/// Provider/model choices with validated selection callbacks.
#[derive(IntoElement)]
pub struct ModelSelector {
    id: ElementId,
    catalog: ProviderCatalog,
    selection: ProviderSelection,
    theme: AuroraTheme,
    on_select: Option<SelectionHandler>,
}
impl ModelSelector {
    pub fn new(
        id: impl Into<ElementId>,
        providers: Vec<Provider>,
        selection: ProviderSelection,
    ) -> Self {
        Self {
            id: id.into(),
            catalog: ProviderCatalog::new(providers),
            selection,
            theme: AuroraTheme::default(),
            on_select: None,
        }
    }
    #[must_use]
    pub fn catalog(mut self, catalog: ProviderCatalog) -> Self {
        self.catalog = catalog;
        self
    }
    #[must_use]
    pub const fn theme(mut self, theme: AuroraTheme) -> Self {
        self.theme = theme;
        self
    }
    #[must_use]
    pub fn on_select(
        mut self,
        handler: impl Fn(ProviderSelection, &ClickEvent, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_select = Some(Rc::new(handler));
        self
    }
}
impl RenderOnce for ModelSelector {
    fn render(self, _: &mut Window, _: &mut App) -> impl IntoElement {
        let selected = self.selection;
        let theme = self.theme;
        let callback = self.on_select;
        let catalog = self.catalog;
        div()
            .id(self.id)
            .role(AccessibleRole::ComboBox)
            .tab_index(0)
            .aria_label("Provider and model")
            .aria_expanded(true)
            .flex()
            .flex_col()
            .gap(px(theme.space.xs))
            .children(
                catalog
                    .providers
                    .clone()
                    .into_iter()
                    .flat_map(move |provider| {
                        let provider_id = provider.id.clone();
                        let callback = callback.clone();
                        let selected = selected.clone();
                        let catalog = catalog.clone();
                        provider.models.into_iter().map(move |model: Model| {
                            let choice = ProviderSelection {
                                provider: provider_id.clone(),
                                model: model.id.clone(),
                            };
                            let is_selected = choice == selected;
                            let callback = callback.clone();
                            let error = catalog.validate(&choice).err();
                            let enabled = error.is_none();
                            let mut option =
                                div()
                                    .id(ElementId::Name(
                                        format!("model-{}-{}", choice.provider.0, choice.model.0)
                                            .into(),
                                    ))
                                    .role(AccessibleRole::ListBoxOption)
                                    .when(enabled, |element| element.tab_index(0))
                                    .aria_label(model.label.clone())
                                    .aria_description(error.map_or_else(
                                        || "Available".into(),
                                        |error| error.to_string(),
                                    ))
                                    .aria_selected(is_selected)
                                    .when(is_selected, |element| {
                                        element.bg(gpui::Hsla::from(theme.colors.surface_active))
                                    });
                            if enabled && let Some(handler) = callback {
                                let click_handler = handler.clone();
                                let click_choice = choice.clone();
                                option = option
                                    .on_click(move |event, window, cx| {
                                        click_handler(click_choice.clone(), event, window, cx);
                                    })
                                    .on_key_down({
                                        let handler = handler.clone();
                                        let choice = choice.clone();
                                        move |event, window, cx| {
                                            if is_activation_key(event) {
                                                handler(
                                                    choice.clone(),
                                                    &ClickEvent::default(),
                                                    window,
                                                    cx,
                                                );
                                            }
                                        }
                                    })
                                    .on_a11y_action(
                                        AccessibleAction::Click,
                                        move |_, window, cx| {
                                            handler(
                                                choice.clone(),
                                                &ClickEvent::default(),
                                                window,
                                                cx,
                                            );
                                        },
                                    );
                            }
                            option = option.child(model.label);
                            option
                        })
                    }),
            )
    }
}

fn action_label(action: &Action) -> &'static str {
    match action {
        Action::Copy => "Copy",
        Action::Retry => "Retry",
        Action::Cancel => "Cancel",
        Action::Approval {
            decision: crate::ApprovalDecision::Approve,
            ..
        } => "Approve",
        Action::Approval {
            decision: crate::ApprovalDecision::Deny,
            ..
        } => "Deny",
        Action::Elicitation { .. } => "Respond",
        Action::Edit { apply: true, .. } => "Apply Edit",
        Action::Edit { apply: false, .. } => "Reject Edit",
        Action::OpenCitation { .. } => "Open Citation",
        Action::OpenArtifact { .. } => "Open Artifact",
        Action::RemoveAttachment { .. } => "Remove Attachment",
        Action::Submit => "Submit",
    }
}

/// Returns true when a key event requests the default action.
pub fn is_activation_key(event: &KeyDownEvent) -> bool {
    matches!(event.keystroke.key.as_str(), "enter" | "space")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{ConversationEvent, Message, Role};
    use gpui::{Keystroke, Modifiers};
    #[test]
    fn action_labels_cover_every_action() {
        assert_eq!(action_label(&Action::Copy), "Copy");
        assert_eq!(action_label(&Action::Submit), "Submit");
    }
    #[test]
    fn provider_driven_timeline_builds_render_component() {
        let mut conversation = Conversation::new("example");
        conversation
            .apply(ConversationEvent::MessageAdded(Message::new(
                "user",
                Role::User,
            )))
            .unwrap();
        let _component =
            AgentConversation::new("conversation", conversation).theme(AuroraTheme::default());
    }
    #[test]
    fn enter_and_space_dispatch_default_decision() {
        let event = |key: &str| KeyDownEvent {
            keystroke: Keystroke {
                modifiers: Modifiers::default(),
                key: key.into(),
                key_char: None,
            },
            is_held: false,
            prefer_character_input: false,
        };
        assert!(is_activation_key(&event("enter")));
        assert!(is_activation_key(&event("space")));
        assert!(!is_activation_key(&event("escape")));
    }
}
