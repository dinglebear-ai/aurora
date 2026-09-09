use std::{collections::BTreeSet, fmt};

#[derive(Clone, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub struct ProviderId(pub String);
#[derive(Clone, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub struct ModelId(pub String);
#[derive(Clone, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub struct CommandId(pub String);

#[derive(Clone, Copy, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub enum Capability {
    Attachments,
    Images,
    Tools,
    Approvals,
    Citations,
    Artifacts,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Model {
    pub id: ModelId,
    pub label: String,
    pub description: Option<String>,
    pub capabilities: BTreeSet<Capability>,
}
impl Model {
    pub fn new(id: impl Into<String>, label: impl Into<String>) -> Self {
        Self {
            id: ModelId(id.into()),
            label: label.into(),
            description: None,
            capabilities: BTreeSet::new(),
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Provider {
    pub id: ProviderId,
    pub label: String,
    pub models: Vec<Model>,
}

#[derive(Clone, Debug, Default, Eq, PartialEq)]
pub struct ProviderCatalog {
    pub providers: Vec<Provider>,
    pub required_capabilities: BTreeSet<Capability>,
}
impl ProviderCatalog {
    pub fn new(providers: Vec<Provider>) -> Self {
        Self {
            providers,
            required_capabilities: BTreeSet::new(),
        }
    }
    #[must_use]
    pub fn requiring(mut self, capability: Capability) -> Self {
        self.required_capabilities.insert(capability);
        self
    }
    /// Validates a selection against catalog entries and operation requirements.
    /// # Errors
    /// Returns [`SelectionError`] for unknown or disabled choices.
    pub fn validate(&self, selection: &ProviderSelection) -> Result<&Model, SelectionError> {
        selection.validate(&self.providers, &self.required_capabilities)
    }
}
impl Provider {
    pub fn new(id: impl Into<String>, label: impl Into<String>, models: Vec<Model>) -> Self {
        Self {
            id: ProviderId(id.into()),
            label: label.into(),
            models,
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Command {
    pub id: CommandId,
    pub label: String,
    pub description: String,
    pub shortcut: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProviderSelection {
    pub provider: ProviderId,
    pub model: ModelId,
}
impl ProviderSelection {
    /// Resolves a selection against a provider catalog.
    ///
    /// # Errors
    /// Returns [`SelectionError`] when either identifier is absent.
    pub fn resolve(
        providers: &[Provider],
        provider: &ProviderId,
        model: &ModelId,
    ) -> Result<Self, SelectionError> {
        let Some(entry) = providers.iter().find(|item| item.id == *provider) else {
            return Err(SelectionError::UnknownProvider(provider.clone()));
        };
        if !entry.models.iter().any(|item| item.id == *model) {
            return Err(SelectionError::UnknownModel {
                provider: provider.clone(),
                model: model.clone(),
            });
        }
        Ok(Self {
            provider: provider.clone(),
            model: model.clone(),
        })
    }

    /// Validates this selection and all requested capabilities.
    ///
    /// # Errors
    /// Returns [`SelectionError`] for unknown IDs or unsupported capabilities.
    pub fn validate<'a>(
        &self,
        providers: &'a [Provider],
        required: &BTreeSet<Capability>,
    ) -> Result<&'a Model, SelectionError> {
        let provider = providers
            .iter()
            .find(|item| item.id == self.provider)
            .ok_or_else(|| SelectionError::UnknownProvider(self.provider.clone()))?;
        let model = provider
            .models
            .iter()
            .find(|item| item.id == self.model)
            .ok_or_else(|| SelectionError::UnknownModel {
                provider: self.provider.clone(),
                model: self.model.clone(),
            })?;
        if let Some(capability) = required
            .iter()
            .find(|capability| !model.capabilities.contains(capability))
        {
            return Err(SelectionError::MissingCapability {
                model: self.model.clone(),
                capability: *capability,
            });
        }
        Ok(model)
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum SelectionError {
    UnknownProvider(ProviderId),
    UnknownModel {
        provider: ProviderId,
        model: ModelId,
    },
    MissingCapability {
        model: ModelId,
        capability: Capability,
    },
}
impl fmt::Display for SelectionError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::UnknownProvider(id) => write!(f, "unknown provider: {}", id.0),
            Self::UnknownModel { provider, model } => {
                write!(f, "unknown model {} for provider {}", model.0, provider.0)
            }
            Self::MissingCapability { model, capability } => {
                write!(f, "model {} does not support {capability:?}", model.0)
            }
        }
    }
}
impl std::error::Error for SelectionError {}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn validates_selection() {
        let providers = vec![Provider::new(
            "local",
            "Local",
            vec![Model::new("small", "Small")],
        )];
        assert!(
            ProviderSelection::resolve(
                &providers,
                &ProviderId("local".into()),
                &ModelId("small".into())
            )
            .is_ok()
        );
        assert!(matches!(
            ProviderSelection::resolve(
                &providers,
                &ProviderId("local".into()),
                &ModelId("large".into())
            ),
            Err(SelectionError::UnknownModel { .. })
        ));
    }

    #[test]
    fn validates_required_capabilities() {
        let providers = vec![Provider::new(
            "local",
            "Local",
            vec![Model::new("text", "Text")],
        )];
        let selection = ProviderSelection {
            provider: ProviderId("local".into()),
            model: ModelId("text".into()),
        };
        assert!(matches!(
            selection.validate(&providers, &BTreeSet::from([Capability::Images])),
            Err(SelectionError::MissingCapability {
                capability: Capability::Images,
                ..
            })
        ));
    }
}
