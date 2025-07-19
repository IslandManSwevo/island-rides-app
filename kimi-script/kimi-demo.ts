import OpenAI from "openai";

(async () => {
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: "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",
    defaultHeaders: {
      "HTTP-Referer": "https://example.com",
      "X-Title": "KeyLo"
    }
  });

  const res = await openai.chat.completions.create({
    model: "moonshotai/kimi-k2:free",
    messages: [{ role: "user", content: "Hello, Kimi!" }]
  });

  console.log(res.choices[0].message.content);
})();
