const fs = require("fs");
const dotenv = require("dotenv");
const { TwitterApi } = require("twitter-api-v2");
const OpenAI = require("openai");

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_CLIENT_ID,
  appSecret: process.env.TWITTER_CLIENT_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

async function runBot() {
  try {
    const temas = [
      "curiosidades científicas",
      "fatos históricos estranhos",
      "mistérios inexplicáveis",
      "curiosidades sobre o corpo humano",
      "psicologia curiosa",
      "curiosidades sobre animais bizarros",
      "fatos sobre filmes ou séries",
      "tecnologia surpreendente",
      "fatos chocantes da natureza",
      "invenções que mudaram o mundo"
    ];

    const tema = temas[Math.floor(Math.random() * temas.length)];

    const prompt = `
Você é um gerador de conteúdo viral do Twitter.

Crie 3 curiosidades bizarras e surpreendentes sobre "${tema}", no estilo “Você sabia que...?”, com até 280 caracteres. Use linguagem chamativa e emojis. Cada curiosidade deve incluir 1 hashtag no final e, se possível, um link relevante fictício (ex: mais info em curiosidades.com/tema).

Depois, crie 1 thread com 4 partes sobre o mesmo tema, com tom narrativo e informativo, também com emojis e hashtags.

Responda somente com JSON no formato:
[
  { "text": "..." },
  { "text": "..." },
  { "text": "..." },
  { "thread": ["Parte 1", "Parte 2", "Parte 3", "Parte 4"] }
]

O conteúdo deve ser escrito de forma cativante, capaz de gerar muitos compartilhamentos.
`;

    const res = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Você é um gerador de conteúdo em JSON puro.",
        },
        { role: "user", content: prompt },
      ],
    });

    const raw = res.choices[0].message.content.trim();
    const jsonStart = raw.indexOf("[");
    const jsonEnd = raw.lastIndexOf("]");
    const jsonText = raw.slice(jsonStart, jsonEnd + 1);

    let tweets;
    try {
      tweets = JSON.parse(jsonText);
    } catch (e) {
      console.error("❌ JSON inválido retornado pela IA:", raw);
      throw e;
    }

    for (const item of tweets) {
      if (item.text) {
        await twitterClient.v2.tweet(item.text);
        console.log("✅ Tweet postado:", item.text);
      } else if (item.thread) {
        const first = await twitterClient.v2.tweet(item.thread[0]);
        console.log("🧵 Início da thread postado");

        let replyTo = first.data.id;
        for (let i = 1; i < item.thread.length; i++) {
          const reply = await twitterClient.v2.reply(item.thread[i], replyTo);
          replyTo = reply.data.id;
          console.log("↳ Resposta postada:", item.thread[i]);
        }

        console.log("✅ Thread finalizada.");
      }
    }
  } catch (error) {
    console.error("❌ Erro no bot:", error);
  }
}

runBot();
