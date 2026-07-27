package tv.tootie.aurora.app.codex

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.Assert.assertEquals
import org.junit.Test

class LoginProtocolTest {

    private val json = Json { ignoreUnknownKeys = true; isLenient = true }

    @Test
    fun `loginWithApiKey frame has correct method and type`() {
        val client = CodexClient("ws://localhost:1", null)
        val frame = client.buildLoginFrame(LoginMethodType.apiKey, "apiKey" to "sk-test-123")
        val parsed = json.parseToJsonElement(frame).jsonObject
        assertEquals("account/login/start", parsed["method"]?.jsonPrimitive?.content)
        assertEquals("apiKey", parsed["params"]!!.jsonObject["type"]?.jsonPrimitive?.content)
        assertEquals("sk-test-123", parsed["params"]!!.jsonObject["apiKey"]?.jsonPrimitive?.content)
    }

    @Test
    fun `loginWithDeviceCode frame has correct method and type`() {
        val client = CodexClient("ws://localhost:1", null)
        val frame = client.buildLoginFrame(LoginMethodType.chatgptDeviceCode)
        val parsed = json.parseToJsonElement(frame).jsonObject
        assertEquals("account/login/start", parsed["method"]?.jsonPrimitive?.content)
        assertEquals("chatgptDeviceCode", parsed["params"]!!.jsonObject["type"]?.jsonPrimitive?.content)
    }

    @Test
    fun `loginWithAuthTokens frame includes accessToken and accountId`() {
        val client = CodexClient("ws://localhost:1", null)
        val frame = client.buildLoginFrame(
            LoginMethodType.chatgptAuthTokens,
            "accessToken" to "ey-tok",
            "chatgptAccountId" to "user-abc",
        )
        val params = json.parseToJsonElement(frame).jsonObject["params"]!!.jsonObject
        assertEquals("chatgptAuthTokens", params["type"]?.jsonPrimitive?.content)
        assertEquals("ey-tok", params["accessToken"]?.jsonPrimitive?.content)
        assertEquals("user-abc", params["chatgptAccountId"]?.jsonPrimitive?.content)
    }

    @Test
    fun `loginWithChatGpt frame has chatgpt type`() {
        val client = CodexClient("ws://localhost:1", null)
        val frame = client.buildLoginFrame(LoginMethodType.chatgpt)
        val params = json.parseToJsonElement(frame).jsonObject["params"]!!.jsonObject
        assertEquals("chatgpt", params["type"]?.jsonPrimitive?.content)
    }
}
