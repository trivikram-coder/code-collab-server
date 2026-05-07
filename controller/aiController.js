// aiController.js

const {
  callAI,
  callAIStream,
  buildMessages,
} = require("../util/aiService");

// ---------------------------------------------------------------------------
// Formatting Rules
// ---------------------------------------------------------------------------

const FORMATTING_RULES = `
=== STRICT CODE FORMATTING RULES ===

1. ALWAYS return properly formatted markdown code blocks

2. NEVER compress code into one line

3. ALWAYS preserve indentation

4. NEVER switch programming languages

5. Use EXACTLY the requested language

6. NEVER explain outside code block in FIX mode

=== END RULES ===
`;

// ---------------------------------------------------------------------------
// System Prompts
// ---------------------------------------------------------------------------

const PROMPTS = {
  chat: `
You are a senior software engineer helping a developer.

${FORMATTING_RULES}
`,

  explain: `
You are a senior software engineer.

Explain code clearly in numbered steps.

${FORMATTING_RULES}
`,

  fix: `
You are an expert debugger.

STRICT RULES:

1. Return ONLY ONE markdown code block
2. Use EXACTLY the requested language
3. NEVER switch languages
4. NEVER explain outside code
5. NEVER compress code into one line
6. ALWAYS preserve indentation

Python Example:

\`\`\`python
def main():
    print("Hello World")


if __name__ == "__main__":
    main()
\`\`\`

Java Example:

\`\`\`java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}
\`\`\`

JavaScript Example:

\`\`\`javascript
function main() {
  console.log("Hello World");
}

main();
\`\`\`

C++ Example:

\`\`\`cpp
#include <iostream>
using namespace std;

int main() {
    cout << "Hello World";

    return 0;
}
\`\`\`

${FORMATTING_RULES}
`,

  analyze: `
You are a code reviewer.

Respond ONLY in this format:

Bugs:
- item

Warnings:
- item

Improvements:
- item

${FORMATTING_RULES}
`,
};

// ---------------------------------------------------------------------------
// User Prompt Builder
// ---------------------------------------------------------------------------

const buildUserContent = ({
  code,
  language,
  message,
}) => {
  const codeSection = code?.trim()
    ? `\`\`\`${language}
${code.trim()}
\`\`\``
    : "No code provided.";

  return `
TARGET LANGUAGE: ${language}

CRITICAL:
- Return code ONLY in ${language}
- NEVER use another language
- Preserve formatting
- Preserve indentation

User Code:
${codeSection}

User Request:
${message || ""}
`;
};

// ---------------------------------------------------------------------------
// Handler Factory
// ---------------------------------------------------------------------------

const createHandler =
  (mode) => async (req, res) => {
    try {
      const {
        code,
        language,
        message,
        chatHistory,
        stream,
      } = req.body;

      const userContent =
        buildUserContent({
          code,
          language,
          message,
        });

      const messages = buildMessages(
        PROMPTS[mode],
        userContent,

        // IMPORTANT:
        // only use chat history for chat mode
        mode === "chat"
          ? chatHistory
          : []
      );

      if (stream) {
        return callAIStream(
          messages,
          res
        );
      }

      const reply =
        await callAI(messages);

      return res.status(200).send(reply);
    } catch (error) {
      console.error(
        `[${mode}] error:`,
        error.message
      );

      return res
        .status(500)
        .send(`${mode} failed`);
    }
  };

// ---------------------------------------------------------------------------

const aiChat =
  createHandler("chat");

const explainCode =
  createHandler("explain");

const fixCode =
  createHandler("fix");

const analyzeCode =
  createHandler("analyze");

// ---------------------------------------------------------------------------

module.exports = {
  aiChat,
  explainCode,
  fixCode,
  analyzeCode,
};