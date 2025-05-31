const fs = require("fs");
const dotenv = require("dotenv");
const { TwitterApi } = require("twitter-api-v2");

dotenv.config();

const client = new TwitterApi({
  appKey: process.env.TWITTER_CLIENT_ID,
  appSecret: process.env.TWITTER_CLIENT_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

const tweets = JSON.parse(fs.readFileSync("tweets.json", "utf-8"));

async function postTweet() {
  if (!tweets.length) {
    console.log("❌ Nenhum tweet para postar.");
    return;
  }

  const item = tweets.shift();

  if (item.text) {
    // Tweet simples
    await client.v2.tweet(item.text);
    console.log("✅ Tweet postado:", item.text);
  } else if (item.thread) {
    // Thread: posta o primeiro, depois responde os outros
    const first = await client.v2.tweet(item.thread[0]);
    console.log("🧵 Início da thread postado");

    let replyTo = first.data.id;
    for (let i = 1; i < item.thread.length; i++) {
      const reply = await client.v2.reply(item.thread[i], replyTo);
      replyTo = reply.data.id;
      console.log("↳ Resposta postada:", item.thread[i]);
    }

    console.log("✅ Thread finalizada.");
  }

  fs.writeFileSync("tweets.json", JSON.stringify(tweets, null, 2));
}

postTweet();
