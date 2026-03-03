import fetch from "node-fetch";

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_IDS = process.env.CHAT_IDS.split(",");
const URL = process.env.URL;

let failCount = 0;
let isDown = false;

async function sendMessage(text) {
  for (let chatId of CHAT_IDS) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        text
      })
    });
  }
}

async function checkSite() {
  try {
    const res = await fetch(URL);
    if (!res.ok) throw new Error();

    if (isDown) {
      await sendMessage("✅ SITE TEKRAR AKTİF");
      isDown = false;
    }

    failCount = 0;

  } catch {
    failCount++;
    if (failCount >= 3 && !isDown) {
      await sendMessage("🚨 SITE DOWN!");
      isDown = true;
    }
  }
}

setInterval(checkSite, 60000);
console.log("Monitoring başladı...");