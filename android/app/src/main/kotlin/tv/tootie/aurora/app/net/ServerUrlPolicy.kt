package tv.tootie.aurora.app.net

import java.net.URI

internal const val DEFAULT_SERVER_URL: String = "ws://10.0.2.2:4500"

private val CLEARTEXT_LOCAL_HOSTS = setOf(
    "10.0.2.2",
    "127.0.0.1",
    "localhost",
    "::1",
    "0:0:0:0:0:0:0:1",
)

/**
 * Returns whether [value] is a WebSocket endpoint Aurora may connect to.
 *
 * Remote endpoints must use `wss://`. Cleartext `ws://` is intentionally
 * restricted to emulator/loopback hosts on every Android API level, matching
 * the application's network security configuration instead of relying on the
 * platform default that differed before API 28.
 */
internal fun isAllowedServerUrl(value: String): Boolean {
    val candidate = value.trim()
    if (candidate.isEmpty()) return false

    val uri = runCatching { URI(candidate) }.getOrNull() ?: return false
    if (uri.isOpaque || uri.userInfo != null || uri.fragment != null) return false

    val scheme = uri.scheme?.lowercase() ?: return false
    val host = uri.host
        ?.removePrefix("[")
        ?.removeSuffix("]")
        ?.lowercase()
        ?.takeIf { it.isNotBlank() }
        ?: return false
    if (uri.port != -1 && uri.port !in 1..65535) return false

    return when (scheme) {
        "wss" -> true
        "ws" -> host in CLEARTEXT_LOCAL_HOSTS
        else -> false
    }
}

/** Returns a trimmed, validated endpoint or throws with a user-safe message. */
internal fun requireAllowedServerUrl(value: String): String {
    val candidate = value.trim()
    require(isAllowedServerUrl(candidate)) {
        "Server URL must use wss://, or ws:// for localhost and the Android emulator only."
    }
    return candidate
}
