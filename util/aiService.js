// aiService.js

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const BASE_REQUEST = {
  model: "openai/gpt-4o-mini",
  temperature: 0.2,   // lower = more deterministic formatting
  max_tokens: 1500,
};

const openRouterHeaders = {
  Authorization: `Bearer ${process.env.OPEN_ROUTER_API_KEY}`,
  "Content-Type": "application/json",
  "HTTP-Referer": "http://localhost:3000",
  "X-Title": "CodeCollab AI",
};

// ---------------------------------------------------------------------------
// Text normalisation
// ---------------------------------------------------------------------------

/**
 * Post-processes raw AI output before it is sent to the client.
 *
 * Key fix: the regex  /```(\w+)([^\n])/  catches cases where the model
 * emits the language tag and the first line of code with no newline between
 * them (e.g. "```javascriptfunction foo()") and inserts the missing newline.
 */
const normaliseText = (text = "") =>
  text
    .replace(/\r\n/g, "\n")          // Windows line endings
    .replace(/\\n/g, "\n")           // escaped newlines from some models
    .replace(/\*\*/g, "")            // bold markers in prose
    .replace(/\*/g, "")              // italic markers in prose
    .replace(/#{1,6} /g, "")         // heading markers in prose
    .replace(/```(\w+)([^\n])/g, "```$1\n$2")  // fix merged language+code
    .trim();

// ---------------------------------------------------------------------------
// Message builder
// ---------------------------------------------------------------------------

const buildMessages = (systemPrompt, userContent, chatHistory = []) => [
  { role: "system", content: systemPrompt },
  ...chatHistory.map(({ role, content }) => ({ role, content })),
  { role: "user", content: userContent },
];

// ---------------------------------------------------------------------------
// Non-streaming call
// ---------------------------------------------------------------------------

const callAI = async (messages) => {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: openRouterHeaders,
    body: JSON.stringify({ ...BASE_REQUEST, messages }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("OpenRouter error:", data);
    throw new Error(data?.error?.message ?? "AI request failed");
  }

  const content = data?.choices?.[0]?.message?.content ?? "";
  return normaliseText(content);
};

// ---------------------------------------------------------------------------
// Streaming call (SSE)
// ---------------------------------------------------------------------------

const callAIStream = async (messages, res) => {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: openRouterHeaders,
    body: JSON.stringify({ ...BASE_REQUEST, messages, stream: true }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Streaming error:", errorText);
    return res.status(500).send("Streaming failed");
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });

    for (const line of chunk.split("\n").filter((l) => l.trim())) {
      if (line === "data: [DONE]") {
        res.write("data: [DONE]\n\n");
        return res.end();
      }

      if (line.startsWith("data: ")) {
        try {
          const json = JSON.parse(line.slice("data: ".length));
          const token = json.choices?.[0]?.delta?.content ?? "";
          if (token) res.write(`data: ${token}\n\n`);
        } catch (err) {
          console.error("Chunk parse error:", err.message);
        }
      }
    }
  }

  res.end();
};

// ---------------------------------------------------------------------------

module.exports = { callAI, callAIStream, buildMessages };