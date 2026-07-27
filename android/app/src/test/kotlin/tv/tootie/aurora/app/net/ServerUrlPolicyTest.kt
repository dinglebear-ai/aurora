package tv.tootie.aurora.app.net

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

class ServerUrlPolicyTest {
    @Test fun secureRemoteWebSocketsAreAllowed() {
        assertTrue(isAllowedServerUrl("wss://example.com/rpc"))
        assertTrue(isAllowedServerUrl(" WSS://EXAMPLE.COM:8443/rpc?client=aurora "))
    }

    @Test fun cleartextWebSocketsAreLimitedToLocalDevelopmentHosts() {
        assertTrue(isAllowedServerUrl("ws://10.0.2.2:4500"))
        assertTrue(isAllowedServerUrl("ws://127.0.0.1:4500/rpc"))
        assertTrue(isAllowedServerUrl("ws://localhost:4500"))
        assertTrue(isAllowedServerUrl("ws://[::1]:4500"))
        assertFalse(isAllowedServerUrl("ws://192.168.1.10:4500"))
        assertFalse(isAllowedServerUrl("ws://example.com/rpc"))
    }

    @Test fun malformedOrCredentialBearingUrlsAreRejected() {
        assertFalse(isAllowedServerUrl("https://example.com"))
        assertFalse(isAllowedServerUrl("wss://user:password@example.com/rpc"))
        assertFalse(isAllowedServerUrl("wss:///missing-host"))
        assertFalse(isAllowedServerUrl("wss://example.com/rpc#fragment"))
        assertFalse(isAllowedServerUrl("wss://example.com:0/rpc"))
        assertFalse(isAllowedServerUrl("wss://example.com:65536/rpc"))
        assertFalse(isAllowedServerUrl("not a url"))
        assertFalse(isAllowedServerUrl(""))
    }

    @Test fun requireAllowedServerUrlTrimsAndExplainsInvalidInput() {
        assertEquals("wss://example.com/rpc", requireAllowedServerUrl(" wss://example.com/rpc "))
        val error = assertThrows(IllegalArgumentException::class.java) {
            requireAllowedServerUrl("ws://example.com/rpc")
        }
        assertTrue(error.message.orEmpty().contains("wss://"))
    }
}
