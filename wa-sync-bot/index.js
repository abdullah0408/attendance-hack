import venom from "venom-bot";
import axios from "axios";
import FormData from "form-data";

const WEBHOOK_URL = "http://YOUR_SERVER_IP:8080/api/webhooks/wa-sync";

venom.create({
  session: "attendance-bot",
  multidevice: true,
  headless: "new",
  useChrome: true,
  browserPath: '/usr/bin/chromium-browser',
  executablePath: "/root/.cache/puppeteer/chrome/linux-121.0.6167.85/chrome-linux64/chrome",
  chromiumArgs: ["--no-sandbox", "--disable-setuid-sandbox"],
  throwErrorOnTosBlock: false,
}).then((client) => start(client))
  .catch((err) => console.error("❌ Venom error:", err));

function start(client) {
  console.log("✅ WhatsApp client ready!");
  client.onMessage(async (msg) => {
    console.log(`📩 ${msg.from} | ${msg.type} | ${msg.body}`);
    if (msg.type === "image") {
      try {
        const base64Data = await client.decryptFile(msg);
        const buffer = Buffer.from(base64Data, "base64");
        const ext = msg.mimetype.split("/")[1];

        const formData = new FormData();
        formData.append("from", msg.from);
        formData.append("type", msg.type);
        formData.append("image", buffer, {
          filename: `image_${Date.now()}.${ext}`,
          contentType: msg.mimetype,
        });

        await axios.post(WEBHOOK_URL, formData, { headers: formData.getHeaders() });
        console.log("🌐 Image sent successfully!");
      } catch (err) {
        console.error("❌ Failed to send image:", err.message);
      }
    }
  });
}
