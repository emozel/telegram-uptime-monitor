import fetch from "node-fetch";

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_IDS = process.env.CHAT_IDS.split(",");
const URLS = process.env.URLS.split(",");

// Site durum hafızası
const siteStatus = {};

async function sendTelegram(message) {
  for (const chatId of CHAT_IDS) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        text: message
      })
    });
  }
}

async function checkSite(url) {
  try {
    const res = await fetch(url, { timeout: 10000 });

    if (res.status >= 200 && res.status < 400) {
      if (siteStatus[url] === "down") {
        await sendTelegram(`✅ ${url} tekrar aktif oldu.`);
      }
      siteStatus[url] = "up";
    } else {
      throw new Error("Status not OK");
    }

  } catch (err) {
    if (siteStatus[url] !== "down") {
      await sendTelegram(`🚨 ${url} şu anda erişilemiyor!`);
    }
    siteStatus[url] = "down";
  }
}

async function monitor() {
  console.log("Kontrol başlatıldı...");
  for (const url of URLS) {
    await checkSite(url.trim());
  }
}

// İlk çalıştırma
monitor();

// 2 dakikada bir kontrol
setInterval(monitor, 120000);
