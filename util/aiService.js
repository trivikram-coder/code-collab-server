
const callAI = async (messages) => {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPEN_ROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000", // optional (for OpenRouter tracking)
        "X-Title": "CodeCollab AI"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini", // you can change model
        messages,
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    const data = await response.json();

    // 🔥 Handle API errors
    if (!response.ok) {
      console.error("OpenRouter Error:", data);
      throw new Error(data?.error?.message || "AI request failed");
    }

    return data.choices[0].message.content;

  } catch (error) {
    console.error("callAI Error:", error.message);
    throw error;
  }
};

module.exports = { callAI };