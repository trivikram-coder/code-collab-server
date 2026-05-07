// aiService.js

const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";

// ---------------------------------------------------------------------------
// Base Request
// ---------------------------------------------------------------------------

const BASE_REQUEST = {
  model: "openai/gpt-4o-mini",
  temperature: 0,
  max_tokens: 1500,
};

// ---------------------------------------------------------------------------
// Headers
// ---------------------------------------------------------------------------

const openRouterHeaders = {
  Authorization: `Bearer ${process.env.OPEN_ROUTER_API_KEY}`,
  "Content-Type": "application/json",
  "HTTP-Referer":
    "http://localhost:3000",
  "X-Title": "CodeCollab AI",
};

// ---------------------------------------------------------------------------
// Safe Text Normalisation
// ---------------------------------------------------------------------------

const normaliseText = (
  text = ""
) => {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "")
    .trim();
};

// ---------------------------------------------------------------------------
// Build Messages
// ---------------------------------------------------------------------------

const buildMessages = (
  systemPrompt,
  userContent,
  chatHistory = []
) => [
  {
    role: "system",
    content: systemPrompt,
  },

  ...chatHistory.map(
    ({ role, content }) => ({
      role,
      content,
    })
  ),

  {
    role: "user",
    content: userContent,
  },
];

// ---------------------------------------------------------------------------
// Non Streaming
// ---------------------------------------------------------------------------

const callAI = async (
  messages
) => {
  const response = await fetch(
    OPENROUTER_URL,
    {
      method: "POST",

      headers: openRouterHeaders,

      body: JSON.stringify({
        ...BASE_REQUEST,
        messages,
      }),
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    console.error(
      "OpenRouter error:",
      data
    );

    throw new Error(
      data?.error?.message ??
        "AI request failed"
    );
  }

  const content =
    data?.choices?.[0]?.message
      ?.content ?? "";

  return normaliseText(content);
};

// ---------------------------------------------------------------------------
// Streaming
// ---------------------------------------------------------------------------

const callAIStream = async (
  messages,
  res
) => {
  const response = await fetch(
    OPENROUTER_URL,
    {
      method: "POST",

      headers: openRouterHeaders,

      body: JSON.stringify({
        ...BASE_REQUEST,
        messages,
        stream: true,
      }),
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "Streaming error:",
      errorText
    );

    return res
      .status(500)
      .send("Streaming failed");
  }

  res.setHeader(
    "Content-Type",
    "text/event-stream"
  );

  res.setHeader(
    "Cache-Control",
    "no-cache"
  );

  res.setHeader(
    "Connection",
    "keep-alive"
  );

  res.flushHeaders();

  const reader =
    response.body.getReader();

  const decoder =
    new TextDecoder();

  let buffer = "";

  while (true) {
    const { done, value } =
      await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(
      value,
      {
        stream: true,
      }
    );

    const events =
      buffer.split("\n\n");

    buffer =
      events.pop() || "";

    for (const event of events) {
      const lines =
        event.split("\n");

      for (const line of lines) {
        if (
          !line.startsWith(
            "data: "
          )
        ) {
          continue;
        }

        const data =
          line.slice(6);

        if (
          data === "[DONE]"
        ) {
          res.write(
            "data: [DONE]\n\n"
          );

          return res.end();
        }

        try {
          const json =
            JSON.parse(data);

          const token =
            json.choices?.[0]
              ?.delta?.content ||
            "";

          if (!token) {
            continue;
          }

          // IMPORTANT:
          // preserve token EXACTLY

          res.write(
            `data: ${token}\n\n`
          );
        } catch (err) {
          console.error(
            "Chunk parse error:",
            err.message
          );
        }
      }
    }
  }

  res.write(
    "data: [DONE]\n\n"
  );

  res.end();
};

// ---------------------------------------------------------------------------

module.exports = {
  callAI,
  callAIStream,
  buildMessages,
};