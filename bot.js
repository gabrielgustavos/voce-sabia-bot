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
  console.log("🚀 Iniciando bot em", new Date().toISOString());

  try {
const temasNetflix = [
  "Stranger Things: Temporada Final",
  "Round 6: Novidades e Bastidores",
  "One Piece: Revelações da 2ª Temporada",
  "Wednesday: Lady Gaga e a Nova Temporada",
  "Frankenstein de Guillermo del Toro",
  "Wake Up Dead Man: Mistério Knives Out",
  "Outer Banks: O que Esperar",
  "Emily in Paris: Novidades da Próxima Temporada",
  "TUDUM 2025: Destaques do Evento",
  "Performances Musicais no TUDUM 2025",
  "Presença de Celebridades no TUDUM 2025",
  "Novas Séries e Filmes Anunciados",
  "Bastidores das Produções da Netflix",
  "Curiosidades sobre Séries Populares da Netflix",
  "Anúncios Exclusivos do TUDUM 2025"
];

    const tema = temasNetflix[Math.floor(Math.random() * temasNetflix.length)];

const prompt = `
Você é um criador de conteúdo para o X (antigo Twitter) especializado em cultura pop e séries da Netflix. Crie 3 curiosidades no estilo “Você sabia que...?” com até 280 caracteres cada, usando um tom viral, criativo, envolvente e que gere engajamento.

Depois, crie uma thread com 4 partes sobre um tema quente entre os fãs, como Stranger Things, Round 6, One Piece, Wednesday ou os destaques do TUDUM 2025 — trazendo curiosidades, teorias, bastidores, spoilers ou informações do evento.

Regras:
- Use linguagem jovem, criativa e descontraída, como um influenciador.
- Use emojis de forma inteligente para chamar atenção 🧠🔥👀🎬
- Exagere nas hashtags, como se fosse uma estratégia de alcance: #Netflix #TUDUM2025 #StrangerThings #Round6 #OnePiece #Wednesday #Curiosidades #SériesNetflix #Fandom #VocêSabia #PopCulture
- NÃO inclua links
- Responda SOMENTE com JSON no formato:
[
  { "text": "..." },
  { "text": "..." },
  { "text": "..." },
  { "thread": ["Parte 1", "Parte 2", "Parte 3", "Parte 4"] }
]
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
        console.log("✅ Bot finalizado com sucesso.");

      }
    }
  } catch (error) {
    console.error("❌ Erro no bot:", error);
  }
}

runBot();
