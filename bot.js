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
    const temasNetflix = [
      "Round 6",
      "Stranger Things",
      "The Witcher",
      "Rebelde Netflix",
      "Dark",
      "TUDUM 2025",
      "Bastidores das séries da Netflix",
      "Novidades da Netflix para 2025"
    ];
    const tema = temasNetflix[Math.floor(Math.random() * temasNetflix.length)];

    const prompt = `
Você é um redator especializado em conteúdo viral de Twitter voltado para fãs da Netflix.

Gere 3 curiosidades impactantes e viciantes sobre o tema "${tema}", estilo “Você sabia que...?”, com até 280 caracteres cada. Use emojis, linguagem de fã, e **exagere nas hashtags**. As hashtags devem incluir coisas como #Netflix #TUDUM2025 #Round6 #StrangerThings #TheWitcher #Dark etc.

Depois, gere 1 thread com 4 partes sobre o mesmo tema. Pode ser sobre segredos dos bastidores, coisas que poucos sabem, spoilers, teorias, ou o que vai rolar no TUDUM 2025.

Formato de saída obrigatório em JSON puro:
[
  { "text": "..." },
  { "text": "..." },
  { "text": "..." },
  { "thread": ["Parte 1", "Parte 2", "Parte 3", "Parte 4"] }
]

Não inclua links. Use tom empolgado, direto e estilo fandom.
`;

    const res = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Você responde apenas com JSON válido, sem explicações.",
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
