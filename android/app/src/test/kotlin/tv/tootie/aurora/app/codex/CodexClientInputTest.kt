package tv.tootie.aurora.app.codex

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.Assert.assertEquals
import org.junit.Test
import tv.tootie.aurora.app.codex.SelectedItem

/**
 * Verify that CodexClient.buildTurnFrame() emits the correct JSON for skill and mention inputs.
 *
 * Tests call the internal buildTurnFrame() helper directly, which exercises JSON serialisation
 * without requiring a real WebSocket connection.
 */
class CodexClientInputTest {

    private val json = Json { ignoreUnknownKeys = true; isLenient = true }

    @Test
    fun `startTurn with no attachments emits single text item`() {
        val client = CodexClient("ws://localhost:1", null)
        val (frame, id) = client.buildTurnFrame(
            threadId = "t1",
            text = "hello",
            attachments = emptyList(),
            model = null,
            effort = null,
        )
        val parsed = json.parseToJsonElement(frame).jsonObject
        assertEquals(id, parsed["id"]?.jsonPrimitive?.content?.toInt())
        assertEquals("turn/start", parsed["method"]?.jsonPrimitive?.content)
        val input = parsed["params"]!!.jsonObject["input"]!!.jsonArray
        assertEquals(1, input.size)
        assertEquals("text", input[0].jsonObject["type"]?.jsonPrimitive?.content)
        assertEquals("hello", input[0].jsonObject["text"]?.jsonPrimitive?.content)
    }

    @Test
    fun `startTurn with skill attachment emits skill item after text`() {
        val client = CodexClient("ws://localhost:1", null)
        val (frame) = client.buildTurnFrame(
            threadId = "t1",
            text = "run this",
            attachments = listOf(SelectedItem.Skill(name = "aurora", path = "aurora")),
            model = null,
            effort = null,
        )
        val input = json.parseToJsonElement(frame).jsonObject["params"]!!
            .jsonObject["input"]!!.jsonArray
        assertEquals(2, input.size)
        val skillItem = input[1].jsonObject
        assertEquals("skill", skillItem["type"]?.jsonPrimitive?.content)
        assertEquals("aurora", skillItem["name"]?.jsonPrimitive?.content)
        assertEquals("aurora", skillItem["path"]?.jsonPrimitive?.content)
    }

    @Test
    fun `startTurn with mention attachment emits mention item after text`() {
        val client = CodexClient("ws://localhost:1", null)
        val (frame) = client.buildTurnFrame(
            threadId = "t1",
            text = "hey @jacob",
            attachments = listOf(SelectedItem.Mention(name = "jacob", path = "jacob")),
            model = null,
            effort = null,
        )
        val input = json.parseToJsonElement(frame).jsonObject["params"]!!
            .jsonObject["input"]!!.jsonArray
        assertEquals(2, input.size)
        val mentionItem = input[1].jsonObject
        assertEquals("mention", mentionItem["type"]?.jsonPrimitive?.content)
        assertEquals("jacob", mentionItem["name"]?.jsonPrimitive?.content)
    }

    @Test
    fun `startTurn with mixed attachments preserves order`() {
        val client = CodexClient("ws://localhost:1", null)
        val (frame) = client.buildTurnFrame(
            threadId = "t1",
            text = "multi",
            attachments = listOf(
                SelectedItem.Skill("superpowers", "superpowers"),
                SelectedItem.Mention("alice", "alice"),
            ),
            model = null,
            effort = null,
        )
        val input = json.parseToJsonElement(frame).jsonObject["params"]!!
            .jsonObject["input"]!!.jsonArray
        assertEquals(3, input.size)
        assertEquals("text", input[0].jsonObject["type"]?.jsonPrimitive?.content)
        assertEquals("skill", input[1].jsonObject["type"]?.jsonPrimitive?.content)
        assertEquals("mention", input[2].jsonObject["type"]?.jsonPrimitive?.content)
    }
}
