const { callAI } = require("../util/aiService");

// 🔥 Common helper to build messages
const buildMessages = (systemPrompt, userContent) => {
  return [
    {
      role: "system",
      content: `You are a senior developer.

Explain code in this format:
1. What it does (1-2 lines)
2. Key points (bullet points)
3. Important notes (if any)

Keep it SHORT and developer-friendly.`,
    },
    {
      role: "user",
      content: userContent,
    },
  ];
};

// 💬 AI CHAT (with full context)
const aiChat = async (req, res) => {
  try {
    const { code, language, message, chatHistory } = req.body;

    const userContent = `
Language: ${language}

Code:
${code}

Previous Chat:
${chatHistory || "None"}

User Question:
${message}
`;

    const messages = buildMessages(
      "You are a senior software engineer helping in a live collaborative editor.",
      userContent
    );

    const reply = await callAI(messages);

    res.status(200).json({ success: true, reply });
  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ success: false, message: "AI Chat failed" });
  }
};

// 🧾 EXPLAIN CODE
const explainCode = async (req, res) => {
  try {
    const { code, language } = req.body;

    const messages = buildMessages(
      "Explain the code clearly in simple terms. Use bullet points if needed.",
      `Language: ${language}\n\nCode:\n${code}`
    );

    const reply = await callAI(messages);

    res.status(200).json({ success: true, explanation: reply });
  } catch (error) {
    console.error("Explain Error:", error);
    res.status(500).json({ success: false, message: "Explain failed" });
  }
};

// 🛠 FIX CODE
const fixCode = async (req, res) => {
  try {
    const { code, language } = req.body;

    const messages = buildMessages(
      "Fix bugs and return only corrected code. No explanation.",
      `Language: ${language}\n\nCode:\n${code}`
    );

    const reply = await callAI(messages);

    res.status(200).json({ success: true, fixedCode: reply });
  } catch (error) {
    console.error("Fix Error:", error);
    res.status(500).json({ success: false, message: "Fix failed" });
  }
};

// 🔍 ANALYZE CODE (bugs + improvements)
const analyzeCode = async (req, res) => {
  try {
    const { code, language } = req.body;

    const messages = buildMessages(
      "Analyze the code and return: bugs, warnings, and improvements clearly.",
      `Language: ${language}\n\nCode:\n${code}`
    );

    const reply = await callAI(messages);

    res.status(200).json({ success: true, analysis: reply });
  } catch (error) {
    console.error("Analyze Error:", error);
    res.status(500).json({ success: false, message: "Analyze failed" });
  }
};

module.exports = {
  aiChat,
  explainCode,
  fixCode,
  analyzeCode,
};