const fs = require("fs");
const dotenv = require("dotenv");
const OpenAI = require("openai");
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateTweets() {
  const prompt = `
Me dê 3 curiosidades no estilo “Você sabia que...?”, com até 280 caracteres cada, respondendo em JSON no formato [{"text": "..."}].

Depois disso, me dê 1 thread com 4 partes, estilo:
{"thread": ["Parte 1", "Parte 2", "Parte 3", "Parte 4"]}
Todas as curiosidades devem ser bizarras ou surpreendentes. Use emojis no final.
`;

  const res = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
  });

  const tweets = JSON.parse(res.choices[0].message.content);
  fs.writeFileSync("tweets.json", JSON.stringify(tweets, null, 2));
  console.log("✅ Tweets (e threads) gerados com sucesso.");
}

generateTweets();
