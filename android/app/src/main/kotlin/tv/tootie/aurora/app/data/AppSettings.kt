package tv.tootie.aurora.app.data

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import android.util.Log
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import java.security.KeyStore
import java.security.MessageDigest
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import tv.tootie.aurora.app.net.DEFAULT_SERVER_URL
import tv.tootie.aurora.app.net.isAllowedServerUrl
import tv.tootie.aurora.app.net.requireAllowedServerUrl

private val Context.store: DataStore<Preferences> by preferencesDataStore("settings")

object Keys {
    val SERVER_URL = stringPreferencesKey("server_url")
    val AUTH_TOKEN = stringPreferencesKey("auth_token")
    val MODEL = stringPreferencesKey("model")
    // Auth method keys
    val AUTH_METHOD = stringPreferencesKey("auth_method")         // "apiKey" | "chatgpt" | "chatgptDeviceCode" | "chatgptAuthTokens"
    val API_KEY = stringPreferencesKey("api_key")
    val ACCESS_TOKEN = stringPreferencesKey("access_token")
    val CHATGPT_ACCOUNT_ID = stringPreferencesKey("chatgpt_account_id")
    val DEVICE_CODE = stringPreferencesKey("device_code")         // ephemeral; cleared after exchange
    // Approval policy
    val APPROVAL_POLICY = stringPreferencesKey("approval_policy")       // wire value; default "on-request"
    val APPROVALS_REVIEWER = stringPreferencesKey("approvals_reviewer") // wire value; default "user"
    // Thread persistence — keyed by server URL to prevent cross-server resume (gtca).
    // Legacy unkeyed keys kept so existing installs can be read once and migrated.
    val THREAD_ID = stringPreferencesKey("thread_id")
    val THREAD_UPDATED_AT = longPreferencesKey("thread_updated_at")

    /** Collision-resistant per-server key. Legacy hash keys are read once for migration. */
    internal fun serverKey(url: String): String = MessageDigest.getInstance("SHA-256")
        .digest(url.trim().toByteArray(Charsets.UTF_8))
        .joinToString("") { "%02x".format(it) }
    fun threadIdForUrl(url: String) = stringPreferencesKey("thread_id_${serverKey(url)}")
    fun threadUpdatedAtForUrl(url: String) = longPreferencesKey("thread_updated_at_${serverKey(url)}")
    internal fun legacyThreadIdForUrl(url: String) = stringPreferencesKey("thread_id_${url.hashCode()}")
    internal fun legacyThreadUpdatedAtForUrl(url: String) = longPreferencesKey("thread_updated_at_${url.hashCode()}")
}

/**
 * Thrown by a secret setter when a non-null credential could not be encrypted and therefore was
 * NOT persisted. The previously stored value (if any) is left untouched. Callers should surface
 * this to the user rather than assuming the credential was saved.
 */
class SecretPersistException(message: String) : Exception(message)

/**
 * At-rest encryption for the secret settings (API key, ChatGPT access token, bearer auth token,
 * ChatGPT account id). Values are encrypted with an AES-256/GCM key held in the AndroidKeyStore,
 * which never leaves secure hardware (non-exportable). Only ciphertext is written to the
 * (plaintext) DataStore file.
 *
 * Storage layout for an encrypted value: Base64(IV ‖ ciphertext+GCM-tag).
 *
 * Decrypt is intentionally lenient: any value that isn't valid ciphertext for the current key
 * (e.g. a legacy plaintext value written before encryption was added, a corrupted entry, or a
 * value encrypted under a key that has since been invalidated) decodes to `null` — treated as
 * "no value" — rather than throwing. This keeps first-run/migration and key-reset graceful.
 *
 * Both failure paths are now observable via [Log] breadcrumbs (no plaintext or ciphertext is ever
 * logged): a failed decrypt logs at WARN (legacy/invalidated value treated as absent), a failed
 * encrypt logs at ERROR and causes the setter to throw [SecretPersistException]. Note: the
 * encryption path is currently unverified by automated tests (no Robolectric/instrumentation
 * harness is set up for the AndroidKeyStore), so this is a visible, accepted decision.
 */

/** 96-bit GCM nonce length; the stored envelope is IV ‖ ciphertext+tag. */
internal const val SECRET_IV_LENGTH = 12

/**
 * Pure, JVM-testable pre-validation of a stored secret value. Splits a Base64(IV ‖ ciphertext)
 * string into (iv, ciphertext), or returns `null` for null/blank/non-Base64/too-short input —
 * exactly the lenient-decrypt branches that classify a value as "absent" BEFORE any
 * AndroidKeyStore touch. The Base64 decoder is injectable so tests can use java.util.Base64
 * instead of the Android stub; production uses the default android.util.Base64 decoder.
 */
internal fun parseSecretEnvelope(
    stored: String?,
    decode: (String) -> ByteArray = { Base64.decode(it, Base64.NO_WRAP) },
): Pair<ByteArray, ByteArray>? {
    if (stored.isNullOrEmpty()) return null
    val combined = runCatching { decode(stored) }.getOrNull() ?: return null  // non-Base64 → absent
    if (combined.size <= SECRET_IV_LENGTH) return null                         // too-short → absent
    return combined.copyOfRange(0, SECRET_IV_LENGTH) to
        combined.copyOfRange(SECRET_IV_LENGTH, combined.size)
}

private object SecretCrypto {
    private const val TAG = "SecretCrypto"
    private const val KEYSTORE = "AndroidKeyStore"
    private const val KEY_ALIAS = "aurora_app_settings_secret_key"
    private const val TRANSFORMATION = "AES/GCM/NoPadding"
    private const val GCM_TAG_BITS = 128

    private fun secretKey(): SecretKey {
        val ks = KeyStore.getInstance(KEYSTORE).apply { load(null) }
        (ks.getEntry(KEY_ALIAS, null) as? KeyStore.SecretKeyEntry)?.let { return it.secretKey }

        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, KEYSTORE)
        val spec = KeyGenParameterSpec.Builder(
            KEY_ALIAS,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256)
            .build()
        generator.init(spec)
        return generator.generateKey()
    }

    /** Encrypts [plain] and returns Base64(IV ‖ ciphertext), or `null` if encryption is unavailable. */
    fun encrypt(plain: String): String? = runCatching {
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, secretKey())
        val iv = cipher.iv
        val ciphertext = cipher.doFinal(plain.toByteArray(Charsets.UTF_8))
        val combined = ByteArray(iv.size + ciphertext.size)
        System.arraycopy(iv, 0, combined, 0, iv.size)
        System.arraycopy(ciphertext, 0, combined, iv.size, ciphertext.size)
        Base64.encodeToString(combined, Base64.NO_WRAP)
    }.onFailure { t ->
        // Breadcrumb only — never log the plaintext being encrypted.
        Log.e(TAG, "secret encryption failed", t)
    }.getOrNull()

    /** Decrypts a Base64(IV ‖ ciphertext) string. Returns `null` for null/blank/legacy/corrupt input. */
    fun decrypt(stored: String?): String? {
        val (iv, ciphertext) = parseSecretEnvelope(stored) ?: return null
        return runCatching {
            val cipher = Cipher.getInstance(TRANSFORMATION)
            cipher.init(Cipher.DECRYPT_MODE, secretKey(), GCMParameterSpec(GCM_TAG_BITS, iv))
            String(cipher.doFinal(ciphertext), Charsets.UTF_8)
        }.onFailure { t ->
            // Lenient by design (legacy plaintext / invalidated key → treated as absent), but make
            // it diagnosable. Never log the stored ciphertext or the decrypted plaintext.
            Log.w(TAG, "secret decrypt failed (legacy/invalidated value treated as absent)", t)
        }.getOrNull()
    }
}

class AppSettings(private val ctx: Context) {
    // Invalid legacy values fall back rather than bypassing the current transport policy.
    val serverUrl: Flow<String> = ctx.store.data.map { preferences ->
        preferences[Keys.SERVER_URL]
            ?.trim()
            ?.takeIf(::isAllowedServerUrl)
            ?: DEFAULT_SERVER_URL
    }
    val authToken: Flow<String?> = ctx.store.data.map { SecretCrypto.decrypt(it[Keys.AUTH_TOKEN]) }
    val model: Flow<String> = ctx.store.data.map { it[Keys.MODEL] ?: "gpt-5.5" }

    // Auth method flows
    val authMethod: Flow<String?> = ctx.store.data.map { it[Keys.AUTH_METHOD] }
    val apiKey: Flow<String?> = ctx.store.data.map { SecretCrypto.decrypt(it[Keys.API_KEY]) }
    val accessToken: Flow<String?> = ctx.store.data.map { SecretCrypto.decrypt(it[Keys.ACCESS_TOKEN]) }
    val chatgptAccountId: Flow<String?> = ctx.store.data.map { SecretCrypto.decrypt(it[Keys.CHATGPT_ACCOUNT_ID]) }

    // Approval policy flows
    val approvalPolicy: Flow<String> = ctx.store.data.map { it[Keys.APPROVAL_POLICY] ?: "on-request" }
    val approvalsReviewer: Flow<String> = ctx.store.data.map { it[Keys.APPROVALS_REVIEWER] ?: "user" }

    /** Returns true if enough credentials are stored to attempt connection. */
    val isAuthenticated: Flow<Boolean> = ctx.store.data.map { prefs ->
        prefs[Keys.AUTH_METHOD] != null
    }

    suspend fun setServerUrl(v: String) {
        val validated = requireAllowedServerUrl(v)
        ctx.store.edit { it[Keys.SERVER_URL] = validated }
    }
    suspend fun setAuthToken(v: String?) {
        if (v == null) { ctx.store.edit { it.remove(Keys.AUTH_TOKEN) }; return }
        val enc = SecretCrypto.encrypt(v)
            ?: throw SecretPersistException("auth token could not be encrypted; not saved")
        ctx.store.edit { it[Keys.AUTH_TOKEN] = enc }
    }
    suspend fun setModel(v: String) = ctx.store.edit { it[Keys.MODEL] = v }

    suspend fun setAuthMethod(v: String?) = ctx.store.edit {
        if (v != null) it[Keys.AUTH_METHOD] = v else it.remove(Keys.AUTH_METHOD)
    }
    suspend fun setApiKey(v: String?) {
        if (v == null) { ctx.store.edit { it.remove(Keys.API_KEY) }; return }
        val enc = SecretCrypto.encrypt(v)
            ?: throw SecretPersistException("API key could not be encrypted; not saved")
        ctx.store.edit { it[Keys.API_KEY] = enc }
    }
    suspend fun setAccessToken(v: String?) {
        if (v == null) { ctx.store.edit { it.remove(Keys.ACCESS_TOKEN) }; return }
        val enc = SecretCrypto.encrypt(v)
            ?: throw SecretPersistException("access token could not be encrypted; not saved")
        ctx.store.edit { it[Keys.ACCESS_TOKEN] = enc }
    }
    suspend fun setChatgptAccountId(v: String?) {
        if (v == null) { ctx.store.edit { it.remove(Keys.CHATGPT_ACCOUNT_ID) }; return }
        val enc = SecretCrypto.encrypt(v)
            ?: throw SecretPersistException("ChatGPT account id could not be encrypted; not saved")
        ctx.store.edit { it[Keys.CHATGPT_ACCOUNT_ID] = enc }
    }

    suspend fun setApprovalPolicy(v: String) = ctx.store.edit { it[Keys.APPROVAL_POLICY] = v }
    suspend fun setApprovalsReviewer(v: String) = ctx.store.edit { it[Keys.APPROVALS_REVIEWER] = v }

    /** Convenience: clears all auth credentials so the app re-shows LoginScreen on next launch. */
    suspend fun clearAuth() = ctx.store.edit {
        it.remove(Keys.AUTH_METHOD)
        it.remove(Keys.API_KEY)
        it.remove(Keys.AUTH_TOKEN)
        it.remove(Keys.ACCESS_TOKEN)
        it.remove(Keys.CHATGPT_ACCOUNT_ID)
    }

    /**
     * Returns the saved thread ID for [serverUrl].
     * Falls back to the legacy unkeyed entry for existing installs that have not yet saved
     * under the new URL-keyed scheme; once [saveThread] is called the legacy entry is cleared.
     */
    fun savedThreadId(serverUrl: String): Flow<String?> = ctx.store.data.map { prefs ->
        prefs[Keys.threadIdForUrl(serverUrl)]?.takeIf { it.isNotBlank() }
            ?: prefs[Keys.legacyThreadIdForUrl(serverUrl)]?.takeIf { it.isNotBlank() }
            ?: prefs[Keys.THREAD_ID]?.takeIf { it.isNotBlank() } // legacy fallback
    }

    suspend fun saveThread(serverUrl: String, id: String) = ctx.store.edit { prefs ->
        prefs[Keys.threadIdForUrl(serverUrl)] = id
        prefs[Keys.threadUpdatedAtForUrl(serverUrl)] = System.currentTimeMillis() / 1000L
        prefs.remove(Keys.legacyThreadIdForUrl(serverUrl))
        prefs.remove(Keys.legacyThreadUpdatedAtForUrl(serverUrl))
        // Clear the legacy unkeyed entry so it is only consulted once per install
        prefs.remove(Keys.THREAD_ID)
        prefs.remove(Keys.THREAD_UPDATED_AT)
    }

    suspend fun clearThreadId(serverUrl: String) = ctx.store.edit { prefs ->
        prefs.remove(Keys.threadIdForUrl(serverUrl))
        prefs.remove(Keys.threadUpdatedAtForUrl(serverUrl))
        prefs.remove(Keys.legacyThreadIdForUrl(serverUrl))
        prefs.remove(Keys.legacyThreadUpdatedAtForUrl(serverUrl))
        // Also clear legacy key in case it hasn't been migrated yet
        prefs.remove(Keys.THREAD_ID)
        prefs.remove(Keys.THREAD_UPDATED_AT)
    }
}
