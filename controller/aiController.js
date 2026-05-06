// aiController.js

const { callAI, callAIStream, buildMessages } = require("../util/aiService");

// ---------------------------------------------------------------------------
// System prompts
// ---------------------------------------------------------------------------

// gpt-4o-mini ignores vague rules. Showing it a concrete bad→good example
// is the most reliable way to get properly formatted output.
const FORMATTING_RULES = `
=== MANDATORY FORMATTING RULES ===

RULE 1: Every code block MUST use this exact format — language tag, then newline, then code:

\`\`\`javascript
function isEven(n) {
  if (n % 2 === 0) {
    return "Even";
  }
  return "Odd";
}
\`\`\`

RULE 2: NEVER merge the language tag with the first line of code.
BAD:  \`\`\`javascriptfunction isEven(n) { ... }
GOOD: \`\`\`javascript
      function isEven(n) {

RULE 3: NEVER compress code onto one line.
BAD:  function isEven(n) { if (n % 2 === 0) { return "Even"; } return "Odd"; }
GOOD: (multi-line, one statement per line, as shown in RULE 1)

RULE 4: Use 2-space indentation for JS/TS, 4-space for Python/Java/C++.

RULE 5: For plain text explanations, write normal prose. Never wrap prose in a \`\`\`text block.

=== END RULES ===
`;

const PROMPTS = {
  chat: `You are a senior software engineer helping a developer understand and improve their code.
${FORMATTING_RULES}`,

  explain: `You are a senior software engineer. Explain the provided code clearly.
Break your explanation into short numbered steps — one step per logical section.
${FORMATTING_RULES}`,

  fix: `You are an expert debugger. Return ONLY the corrected, properly formatted code block.
No preamble. No "Here is the fixed code" sentence. No trailing commentary.
If a change needs explanation, add it as a comment inside the code.
${FORMATTING_RULES}`,

  analyze: `You are a code reviewer. Respond using exactly this structure:

Bugs:
- <list bugs, or "None">

Warnings:
- <list edge cases or risky patterns>

Improvements:
- <list concrete suggestions>

${FORMATTING_RULES}`,
};

// ---------------------------------------------------------------------------
// User content builder
// ---------------------------------------------------------------------------

const buildUserContent = ({ code, language, message, mode }) => {
  const codeSection = code?.trim()
    ? `\`\`\`${language}\n${code.trim()}\n\`\`\``
    : "No code provided.";

  if (mode === "chat") {
    return `Language: ${language}\n\nCode:\n${codeSection}\n\nQuestion:\n${message}`;
  }

  return `Language: ${language}\n\nCode:\n${codeSection}`;
};

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

const createHandler = (mode) => async (req, res) => {
  try {
    const { code, language, message, chatHistory, stream } = req.body;

    const userContent = buildUserContent({ code, language, message, mode });
    const messages = buildMessages(PROMPTS[mode], userContent, chatHistory);

    if (stream) return callAIStream(messages, res);

    const reply = await callAI(messages);
    return res.status(200).send(reply);
  } catch (error) {
    console.error(`[${mode}] error:`, error.message);
    return res.status(500).send(`${mode} request failed`);
  }
};

// ---------------------------------------------------------------------------

const aiChat      = createHandler("chat");
const explainCode = createHandler("explain");
const fixCode     = createHandler("fix");
const analyzeCode = createHandler("analyze");

module.exports = { aiChat, explainCode, fixCode, analyzeCode };