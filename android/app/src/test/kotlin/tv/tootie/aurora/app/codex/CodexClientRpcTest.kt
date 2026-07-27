package tv.tootie.aurora.app.codex

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

/**
 * Wire-frame tests for CodexClient RPC helpers that do not require a real
 * WebSocket connection: steerTurn, setGoal, getGoal, clearGoal, listMcpServers.
 *
 * Each `build*Frame()` helper is `internal` and returns the raw JSON string
 * paired with the embedded request id, mirroring the pattern established by
 * `buildTurnFrame` and `buildLoginFrame`.
 */
class CodexClientRpcTest {

    private val json = Json { ignoreUnknownKeys = true; isLenient = true }

    // -----------------------------------------------------------------------
    // steerTurn
    // -----------------------------------------------------------------------

    @Test
    fun `buildSteerFrame emits turn steer method with text input`() {
        val client = CodexClient("ws://localhost:1", null)
        val (frame, id) = client.buildSteerFrame(
            threadId = "th-1",
            text = "stop and reconsider",
            expectedTurnId = "turn-42",
        )
        val root = json.parseToJsonElement(frame).jsonObject
        assertEquals("turn/steer", root["method"]?.jsonPrimitive?.content)
        assertEquals(id, root["id"]?.jsonPrimitive?.content?.toInt())
        val params = root["params"]!!.jsonObject
        assertEquals("th-1", params["threadId"]?.jsonPrimitive?.content)
        assertEquals("turn-42", params["expectedTurnId"]?.jsonPrimitive?.content)
        val input = params["input"]!!.jsonArray
        assertEquals(1, input.size)
        assertEquals("text", input[0].jsonObject["type"]?.jsonPrimitive?.content)
        assertEquals("stop and reconsider", input[0].jsonObject["text"]?.jsonPrimitive?.content)
    }

    @Test
    fun `buildSteerFrame ids are monotonically increasing`() {
        val client = CodexClient("ws://localhost:1", null)
        val (_, id1) = client.buildSteerFrame("t", "a", "x")
        val (_, id2) = client.buildSteerFrame("t", "b", "y")
        assert(id2 > id1) { "Expected id2 ($id2) > id1 ($id1)" }
    }

    // -----------------------------------------------------------------------
    // setGoal
    // -----------------------------------------------------------------------

    @Test
    fun `buildSetGoalFrame emits thread goal set with objective`() {
        val client = CodexClient("ws://localhost:1", null)
        val (frame, id) = client.buildSetGoalFrame(
            threadId = "th-2",
            objective = "deploy the stack",
        )
        val root = json.parseToJsonElement(frame).jsonObject
        assertEquals("thread/goal/set", root["method"]?.jsonPrimitive?.content)
        assertEquals(id, root["id"]?.jsonPrimitive?.content?.toInt())
        val params = root["params"]!!.jsonObject
        assertEquals("th-2", params["threadId"]?.jsonPrimitive?.content)
        assertEquals("deploy the stack", params["objective"]?.jsonPrimitive?.content)
        // tokenBudget omitted when null
        assertNull(params["tokenBudget"])
    }

    @Test
    fun `buildSetGoalFrame includes tokenBudget when provided`() {
        val client = CodexClient("ws://localhost:1", null)
        val (frame) = client.buildSetGoalFrame(
            threadId = "th-2",
            objective = "run tests",
            tokenBudget = 4096,
        )
        val params = json.parseToJsonElement(frame).jsonObject["params"]!!.jsonObject
        assertEquals(4096, params["tokenBudget"]?.jsonPrimitive?.content?.toInt())
    }

    // -----------------------------------------------------------------------
    // getGoal
    // -----------------------------------------------------------------------

    @Test
    fun `buildGetGoalFrame emits thread goal get with threadId`() {
        val client = CodexClient("ws://localhost:1", null)
        val (frame, id) = client.buildGetGoalFrame(threadId = "th-3")
        val root = json.parseToJsonElement(frame).jsonObject
        assertEquals("thread/goal/get", root["method"]?.jsonPrimitive?.content)
        assertEquals(id, root["id"]?.jsonPrimitive?.content?.toInt())
        assertEquals("th-3", root["params"]!!.jsonObject["threadId"]?.jsonPrimitive?.content)
    }

    // -----------------------------------------------------------------------
    // clearGoal
    // -----------------------------------------------------------------------

    @Test
    fun `buildClearGoalFrame emits thread goal clear with threadId`() {
        val client = CodexClient("ws://localhost:1", null)
        val (frame, id) = client.buildClearGoalFrame(threadId = "th-4")
        val root = json.parseToJsonElement(frame).jsonObject
        assertEquals("thread/goal/clear", root["method"]?.jsonPrimitive?.content)
        assertEquals(id, root["id"]?.jsonPrimitive?.content?.toInt())
        assertEquals("th-4", root["params"]!!.jsonObject["threadId"]?.jsonPrimitive?.content)
    }

    // -----------------------------------------------------------------------
    // listMcpServers
    // -----------------------------------------------------------------------

    @Test
    fun `buildListMcpServersFrame emits mcpServerStatus list with detail field`() {
        val client = CodexClient("ws://localhost:1", null)
        val (frame, id) = client.buildListMcpServersFrame()
        val root = json.parseToJsonElement(frame).jsonObject
        assertEquals("mcpServerStatus/list", root["method"]?.jsonPrimitive?.content)
        assertEquals(id, root["id"]?.jsonPrimitive?.content?.toInt())
        assertEquals(
            "toolsAndAuthOnly",
            root["params"]!!.jsonObject["detail"]?.jsonPrimitive?.content,
        )
    }
}
