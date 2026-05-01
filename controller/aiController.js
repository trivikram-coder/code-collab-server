const { callAI, callAIStream } = require("../util/aiService");

/**
 * 🔥 CLEAN TEXT HELPER (removes junk formatting)
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
 * 🔥 MESSAGE BUILDER (FIXED)
 */
const buildMessages = (systemPrompt, userContent, chatHistory = []) => {
  return [
    {
      role: "system",
      content: systemPrompt,
    },
    ...(chatHistory || []).map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    {
      role: "user",
      content: userContent,
    },
  ];
};

/**
 * 💬 AI CHAT
 */
const aiChat = async (req, res) => {
  try {
    const { code, language, message, chatHistory, stream } = req.body;

    const systemPrompt = `
You are a senior software engineer.

STRICT RULES:
- Return plain text only
- NO markdown
- NO symbols like *** ###
- Keep it short and clear

Format:
Explanation:
Key Points:
Code:
Notes:
`;

    const userContent = `
Language: ${language}

Code:
${code || "No code"}

User Question:
${message}
`;

    const messages = buildMessages(systemPrompt, userContent, chatHistory);

    // 🚀 STREAM MODE
    if (stream) {
      return await callAIStream(messages, res);
    }

    const reply = await callAI(messages);

    res.status(200).json({
      success: true,
      reply: cleanText(reply),
    });

  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ success: false, message: "AI Chat failed" });
  }
};

/**
 * 🧾 EXPLAIN CODE
 */
const explainCode = async (req, res) => {
  try {
    const { code, language, stream } = req.body;

    const systemPrompt = `
Explain the code in simple terms.

STRICT RULES:
- Plain text only
- No markdown
- No symbols
- Short explanation
`;

    const userContent = `
Language: ${language}

Code:
${code}
`;

    const messages = buildMessages(systemPrompt, userContent);

    if (stream) {
      return await callAIStream(messages, res);
    }

    const reply = await callAI(messages);

    res.status(200).json({
      success: true,
      explanation: cleanText(reply),
    });

  } catch (error) {
    console.error("Explain Error:", error);
    res.status(500).json({ success: false, message: "Explain failed" });
  }
};

/**
 * 🛠 FIX CODE
 */
const fixCode = async (req, res) => {
  try {
    const { code, language, stream } = req.body;

    const systemPrompt = `
You are an expert debugger.

STRICT RULES:
- Return ONLY corrected code
- No explanation
- No markdown
`;

    const userContent = `
Language: ${language}

Code:
${code}
`;

    const messages = buildMessages(systemPrompt, userContent);

    if (stream) {
      return await callAIStream(messages, res);
    }

    const reply = await callAI(messages);

    res.status(200).json({
      success: true,
      fixedCode: cleanText(reply),
    });

  } catch (error) {
    console.error("Fix Error:", error);
    res.status(500).json({ success: false, message: "Fix failed" });
  }
};

/**
 * 🔍 ANALYZE CODE
 */
const analyzeCode = async (req, res) => {
  try {
    const { code, language, stream } = req.body;

    const systemPrompt = `
Analyze the code.

STRICT RULES:
- Plain text only
- No markdown
- Return:
  Bugs
  Warnings
  Improvements
`;

    const userContent = `
Language: ${language}

Code:
${code}
`;

    const messages = buildMessages(systemPrompt, userContent);

    if (stream) {
      return await callAIStream(messages, res);
    }

    const reply = await callAI(messages);

    res.status(200).json({
      success: true,
      analysis: cleanText(reply),
    });

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