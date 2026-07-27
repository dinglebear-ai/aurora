package tv.tootie.aurora.app.ui.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import tv.tootie.aurora.app.CodexApp
import tv.tootie.aurora.app.codex.ApprovalPolicy
import tv.tootie.aurora.app.codex.ApprovalsReviewer
import android.widget.Toast
import tv.tootie.aurora.app.codex.ConfigEditEntry
import tv.tootie.aurora.app.codex.ConfigMergeStrategy
import tv.tootie.aurora.app.data.AppSettings
import tv.tootie.aurora.app.data.SecretPersistException
import tv.tootie.aurora.app.net.requireAllowedServerUrl
import tv.tootie.aurora.components.AuroraButton
import tv.tootie.aurora.components.AuroraButtonVariant
import tv.tootie.aurora.components.AuroraDropdownMenu
import tv.tootie.aurora.components.AuroraField
import tv.tootie.aurora.components.AuroraMenuEntry
import tv.tootie.aurora.components.AuroraSwitch
import tv.tootie.aurora.components.AuroraTextField
import kotlinx.serialization.json.JsonPrimitive

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onBack: () -> Unit,
    onLogout: () -> Unit,
    onPlugins: () -> Unit = {},
) {
    val ctx = LocalContext.current
    val settings = remember { AppSettings(ctx) }
    val scope = rememberCoroutineScope()
    var url by remember { mutableStateOf("ws://10.0.2.2:4500") }
    var token by remember { mutableStateOf("") }
    var model by remember { mutableStateOf("gpt-5.5") }
    var approvalPolicyMenuOpen by remember { mutableStateOf(false) }
    var reviewerMenuOpen by remember { mutableStateOf(false) }
    var selectedApprovalPolicy by remember { mutableStateOf(ApprovalPolicy.OnRequest) }
    var selectedReviewer by remember { mutableStateOf(ApprovalsReviewer.User) }

    val vm: SettingsViewModel = viewModel()
    val state by vm.state.collectAsStateWithLifecycle()

    // Load saved settings and trigger config/read + experimental feature list on first render
    LaunchedEffect(Unit) {
        url = settings.serverUrl.first()
        token = settings.authToken.first().orEmpty()
        model = settings.model.first()
        selectedApprovalPolicy = ApprovalPolicy.fromWire(settings.approvalPolicy.first())
        selectedReviewer = ApprovalsReviewer.fromWire(settings.approvalsReviewer.first())
        vm.loadConfig()
        vm.loadExperimentalFeatures()
    }

    // Navigate away when logout completes; show toast on ConfigLoaded/ConfigSaved.
    LaunchedEffect(state.pendingEvent) {
        when (state.pendingEvent) {
            is SettingsUiEvent.LoggedOut -> {
                vm.consumeEvent()
                onLogout()
            }
            is SettingsUiEvent.ConfigLoaded -> {
                vm.consumeEvent()
                Toast.makeText(ctx, "Config loaded from server", Toast.LENGTH_SHORT).show()
            }
            is SettingsUiEvent.ConfigSaved -> {
                vm.consumeEvent()
                Toast.makeText(ctx, "Config saved to server", Toast.LENGTH_SHORT).show()
            }
            null -> Unit
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings") },
                navigationIcon = {
                    IconButton(onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                ),
            )
        },
    ) { pad ->
        Column(
            Modifier
                .padding(pad)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Text("Connection", style = MaterialTheme.typography.titleMedium)

            AuroraField(
                label = "Server URL",
                description = "WebSocket URL of your Codex app-server",
            ) {
                AuroraTextField(
                    value = url,
                    onValueChange = { url = it },
                    placeholder = "ws://host:port",
                    modifier = Modifier.fillMaxWidth(),
                )
            }

            AuroraField(
                label = "Auth Token",
                description = "Bearer token (leave blank if not required)",
            ) {
                AuroraTextField(
                    value = token,
                    onValueChange = { token = it },
                    placeholder = "optional",
                    modifier = Modifier.fillMaxWidth(),
                )
            }

            Spacer(Modifier.height(4.dp))
            Text("Codex Config", style = MaterialTheme.typography.titleMedium)

            // Config error banner
            if (state.configError != null) {
                Text(
                    text = state.configError!!,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall,
                )
            }

            AuroraField(label = "Model") {
                AuroraTextField(
                    value = model,
                    onValueChange = { model = it },
                    modifier = Modifier.fillMaxWidth(),
                )
            }

            AuroraField(
                label = "Approval Policy",
                description = "Controls when Codex pauses for approval",
            ) {
                AuroraDropdownMenu(
                    entries = ApprovalPolicy.entries.map { policy ->
                        AuroraMenuEntry.Item(
                            label = policy.displayName,
                            onClick = { selectedApprovalPolicy = policy; approvalPolicyMenuOpen = false },
                        )
                    },
                    expanded = approvalPolicyMenuOpen,
                    onDismissRequest = { approvalPolicyMenuOpen = false },
                    anchor = {
                        AuroraButton(
                            onClick = { approvalPolicyMenuOpen = true },
                            variant = AuroraButtonVariant.Outlined,
                            modifier = Modifier.fillMaxWidth(),
                        ) { Text(selectedApprovalPolicy.displayName) }
                    },
                )
            }

            AuroraField(
                label = "Approvals Reviewer",
                description = "Who reviews approval requests",
            ) {
                AuroraDropdownMenu(
                    entries = ApprovalsReviewer.entries.map { reviewer ->
                        AuroraMenuEntry.Item(
                            label = reviewer.displayName,
                            onClick = { selectedReviewer = reviewer; reviewerMenuOpen = false },
                        )
                    },
                    expanded = reviewerMenuOpen,
                    onDismissRequest = { reviewerMenuOpen = false },
                    anchor = {
                        AuroraButton(
                            onClick = { reviewerMenuOpen = true },
                            variant = AuroraButtonVariant.Outlined,
                            modifier = Modifier.fillMaxWidth(),
                        ) { Text(selectedReviewer.displayName) }
                    },
                )
            }

            // Config read/write row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                // "Load from server" — issues config/read and populates form fields
                AuroraButton(
                    onClick = {
                        vm.loadConfigFromServer { flat ->
                            flat["model"]?.let { model = it }
                            flat["approvalPolicy"]?.let {
                                selectedApprovalPolicy = ApprovalPolicy.fromWire(it)
                            }
                        }
                    },
                    variant = AuroraButtonVariant.Outlined,
                    loading = state.isLoadingConfig,
                    modifier = Modifier.weight(1f),
                ) { Text("Load from server") }

                // "Push to server" — issues config/batchWrite with current form values
                AuroraButton(
                    onClick = {
                        vm.saveConfigToServer(
                            edits = listOf(
                                ConfigEditEntry(
                                    key = "model",
                                    value = JsonPrimitive(model),
                                    strategy = ConfigMergeStrategy.Upsert.wire,
                                ),
                                ConfigEditEntry(
                                    key = "approvalPolicy",
                                    value = JsonPrimitive(selectedApprovalPolicy.wire),
                                    strategy = ConfigMergeStrategy.Upsert.wire,
                                ),
                            ),
                            reloadUserConfig = true,
                        )
                    },
                    variant = AuroraButtonVariant.Outlined,
                    loading = state.isSavingConfig,
                    modifier = Modifier.weight(1f),
                ) { Text("Push to server") }
            }

            AuroraButton(
                onClick = {
                    scope.launch {
                        val validatedUrl = runCatching { requireAllowedServerUrl(url) }
                            .getOrElse { error ->
                                Toast.makeText(
                                    ctx,
                                    error.message ?: "Enter a valid secure WebSocket URL.",
                                    Toast.LENGTH_LONG,
                                ).show()
                                return@launch
                            }
                        try {
                            // Persist the non-secret fields first; setAuthToken (the only
                            // setter that can throw on Keystore failure) runs last, so a
                            // failure leaves every other field correctly saved and only the
                            // token unchanged — matching the error message below.
                            settings.setServerUrl(validatedUrl)
                            settings.setModel(model)
                            settings.setApprovalPolicy(selectedApprovalPolicy.wire)
                            settings.setApprovalsReviewer(selectedReviewer.wire)
                            settings.setAuthToken(token.takeIf { it.isNotBlank() })
                            val app = ctx.applicationContext as CodexApp
                            app.repository.reconnect(validatedUrl, token.takeIf { it.isNotBlank() })
                            url = validatedUrl
                            onBack()
                        } catch (e: SecretPersistException) {
                            // Keystore encryption failed — don't reconnect with a half-saved
                            // state or crash the coroutine; the previous token is preserved.
                            Toast.makeText(
                                ctx,
                                "Couldn't securely save your token on this device. Please try again.",
                                Toast.LENGTH_LONG,
                            ).show()
                        }
                    }
                },
                variant = AuroraButtonVariant.Filled,
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Save") }

            Spacer(Modifier.height(8.dp))

            Text("Plugins", style = MaterialTheme.typography.titleMedium)

            AuroraButton(
                onClick = onPlugins,
                variant = AuroraButtonVariant.Outlined,
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Browse plugins") }

            Spacer(Modifier.height(8.dp))

            Text("Account", style = MaterialTheme.typography.titleMedium)

            // Account details: plan, email, credits
            state.accountInfo?.let { info ->
                if (info.email != null) {
                    AccountInfoRow(label = "Email", value = info.email)
                }
                if (info.planType != null) {
                    AccountInfoRow(label = "Plan", value = info.planType)
                }
                if (info.creditsBalance != null) {
                    AccountInfoRow(label = "Credits", value = info.creditsBalance)
                }
            }

            // Rate-limit state
            state.rateLimits?.let { rl ->
                if (rl.requestsRemaining != null) {
                    AccountInfoRow(label = "Requests remaining", value = rl.requestsRemaining.toString())
                }
                if (rl.resetTime != null) {
                    AccountInfoRow(label = "Resets at", value = rl.resetTime)
                }
            }

            if (state.logoutError != null) {
                Text(
                    text = "Error: ${state.logoutError}",
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall,
                )
            }

            AuroraButton(
                onClick = { vm.logout() },
                variant = AuroraButtonVariant.Outlined,
                loading = state.isLoggingOut,
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Log out") }

            Spacer(Modifier.height(8.dp))

            // --- Codex config viewer ---
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text("Codex configuration", style = MaterialTheme.typography.titleMedium)
                AuroraButton(
                    onClick = { vm.loadConfig() },
                    variant = AuroraButtonVariant.Outlined,
                    loading = state.isLoadingConfig,
                ) { Text("Refresh") }
            }

            when {
                state.configError != null -> {
                    Text(
                        text = "Error: ${state.configError}",
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
                state.isLoadingConfig && state.configEntries.isEmpty() -> {
                    CircularProgressIndicator()
                }
                state.configEntries.isEmpty() -> {
                    Text(
                        "No configuration received.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                else -> {
                    ConfigViewer(entries = state.configEntries)
                }
            }

            Spacer(Modifier.height(8.dp))

            // --- Experimental features ---
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text("Experimental", style = MaterialTheme.typography.titleMedium)
                AuroraButton(
                    onClick = { vm.loadExperimentalFeatures() },
                    variant = AuroraButtonVariant.Outlined,
                    loading = state.isLoadingExperimental,
                ) { Text("Refresh") }
            }

            when {
                state.experimentalError != null -> {
                    Text(
                        text = "Error: ${state.experimentalError}",
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
                state.isLoadingExperimental && state.experimentalFeatures.isEmpty() -> {
                    CircularProgressIndicator()
                }
                state.experimentalFeatures.isEmpty() -> {
                    Text(
                        "No experimental features available.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                else -> {
                    ExperimentalFeaturesViewer(
                        features = state.experimentalFeatures,
                        onToggle = { name, enabled -> vm.toggleFeature(name, enabled) },
                    )
                }
            }
        }
    }
}

@Composable
private fun ExperimentalFeaturesViewer(
    features: List<ExperimentalFeature>,
    onToggle: (name: String, enabled: Boolean) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(0.dp)) {
        features.forEachIndexed { idx, feature ->
            if (idx > 0) HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = feature.name,
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                    if (feature.description != null) {
                        Text(
                            text = feature.description,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
                AuroraSwitch(
                    checked = feature.enabled,
                    onCheckedChange = { onToggle(feature.name, it) },
                )
            }
        }
    }
}

@Composable
private fun ConfigViewer(entries: List<ConfigEntry>) {
    Column(verticalArrangement = Arrangement.spacedBy(0.dp)) {
        entries.forEachIndexed { idx, entry ->
            if (idx > 0) HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 6.dp),
                verticalAlignment = Alignment.Top,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = entry.key,
                        style = MaterialTheme.typography.labelMedium.copy(fontFamily = FontFamily.Monospace),
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                    if (entry.layer != null) {
                        Text(
                            text = entry.layer,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
                Text(
                    text = entry.value,
                    style = MaterialTheme.typography.bodySmall.copy(fontFamily = FontFamily.Monospace),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(start = 12.dp),
                )
            }
        }
    }
}

/** Single label/value row for account metadata display. */
@Composable
private fun AccountInfoRow(label: String, value: String) {
    androidx.compose.foundation.layout.Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodySmall,
        )
    }
}
