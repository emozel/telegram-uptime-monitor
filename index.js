import fetch from "node-fetch";
import http from "http";

// ENV
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_IDS = process.env.CHAT_IDS.split(",");
const URLS = process.env.URLS.split(",");
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL || "120000");
const TIMEOUT = parseInt(process.env.TIMEOUT || "10000");
const PORT = process.env.PORT || 3000;

// Site durum hafızası
const siteStatus = {};

// Telegram mesaj gönderme
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

// Site kontrol
async function checkSite(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

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
      await sendTelegram(`🚨 ${url} erişilemiyor!!`);
    }
    siteStatus[url] = "down";
  }
}

// Monitor döngüsü
async function monitor() {
  console.log("...Kontrol başladı...");
  for (const url of URLS) {
    await checkSite(url.trim());
  }
}

// 👇 Başlangıçta Telegram mesajı
sendTelegram("🚀 Monitoring Service başladı!!").then(() => {
  console.log("Başlangıç mesajı gönderildi.");
  // Deploy sonrası hemen bir test çalıştır
  monitor();
});

// 2 dakikada bir kontrol
setInterval(monitor, CHECK_INTERVAL);

// 👇 Render Web Service için HTTP server
http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Monitoring service is running.");
}).listen(PORT, () => {
  console.log("Server running on port", PORT);
});


