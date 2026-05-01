
/**
 * 🔥 CLEAN TEXT (remove unwanted formatting)
 */
const cleanText = (text = "") => {
  return text
    .replace(/\\n/g, " ")
    .replace(/\n/g, " ")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/#{1,6}/g, "")
    .replace(/\s+/g, " ")
    .trim();
};



/**
 * 🔥 SYSTEM PROMPT BUILDER
 */
const buildMessages = (messages, mode = "default") => {
  let systemPrompt = `
You are a senior software engineer.

STRICT RULES:
- Return plain text only
- NO markdown
- NO symbols like *** ###
- Keep it short and clean

Format:
Explanation:
Key Points:
Code:
Notes:
`;

  // 🔥 Debug mode
  if (mode === "debug") {
    systemPrompt = `
You are a debugging expert.

STRICT RULES:
- Plain text only
- No markdown
- No symbols

Return:
1. Issue
2. Reason
3. Fix
4. Corrected Code
`;
  }

  // 🔥 UI mode
  if (mode === "ui") {
    systemPrompt = `
You are a frontend UI expert.

STRICT RULES:
- Plain text only
- No markdown

Focus:
- Clean UI
- Responsive
- Modern design
`;
  }

  return [
    { role: "system", content: systemPrompt },
    ...messages,
  ];
};



/**
 * ✅ NORMAL AI CALL
 */
const callAI = async (messages, mode = "default") => {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPEN_ROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "CodeCollab AI",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: buildMessages(messages, mode),
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter Error:", data);
      throw new Error(data?.error?.message || "AI request failed");
    }

    const content = data?.choices?.[0]?.message?.content || "";

    return cleanText(content);

  } catch (error) {
    console.error("callAI Error:", error.message);
    throw error;
  }
};



/**
 * 🚀 STREAMING AI CALL (SSE)
 */
const callAIStream = async (messages, res, mode = "default") => {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPEN_ROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: buildMessages(messages, mode),
        temperature: 0.3,
        max_tokens: 1000,
        stream: true,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Streaming Error:", err);
      return res.status(500).send("Streaming failed");
    }

    // 🔥 SSE HEADERS
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders(); // 🔥 IMPORTANT

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      const lines = chunk.split("\n").filter(line => line.trim() !== "");

      for (const line of lines) {
        if (line === "data: [DONE]") {
          res.write("data: [DONE]\n\n");
          return res.end();
        }

        if (line.startsWith("data: ")) {
          try {
            const json = JSON.parse(line.replace("data: ", ""));
            let content = json.choices?.[0]?.delta?.content;

            if (content) {
              content = cleanText(content); // 🔥 CLEAN STREAM
              res.write(`data: ${content}\n\n`);
            }

          } catch (err) {
            console.error("Chunk parse error:", err.message);
          }
        }
      }
    }

  } catch (error) {
    console.error("callAIStream Error:", error.message);
    res.status(500).send("Streaming failed");
  }
};



module.exports = {
  callAI,
  callAIStream,
};