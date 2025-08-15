import "dotenv/config";
import express from "express";
import venom from "venom-bot";

const app = express();
const port = process.env.WA_SEND_MESSAGE_BOT_PORT || 3001;

app.use(express.json());

let client;

venom
  .create({
    session: "attendance-bot",
    multidevice: true,
    headless: "new",
    useChrome: true,
    browserPath: "/usr/bin/chromium-browser",
    chromiumArgs: ["--no-sandbox", "--disable-setuid-sandbox"],
    throwErrorOnTosBlock: false,
  })
  .then((c) => {
    client = c;
    console.log("✅ Venom client ready");
  })
  .catch((err) => console.error("❌ Venom error:", err));

app.post("/send-message", async (req, res) => {
  const { phoneNumber, message } = req.body;

  if (!phoneNumber || !message) {
    console.error("❌ Phone number and message are required");
    return res
      .status(400)
      .send({ error: "Phone number and message are required" });
  }

  if (phoneNumber.length !== 10) {
    console.error("❌ Phone number must be of 10 digits");
    return res.status(400).send({ error: "Phone number must be of 10 digits" });
  }

  if (!client) {
    return res.status(500).send({ error: "Venom client is not ready yet" });
  }

  try {
    const formattedNumber = `91${phoneNumber}@c.us`;
    await client.sendText(formattedNumber, message);
    console.log(`✅ Message sent to ${formattedNumber}: ${message}`);
    res.send({ success: true, message: `Message sent to ${phoneNumber}` });
  } catch (error) {
    console.error("❌ Error sending message:", error);
    res.status(500).send({ error: "Failed to send message" });
  }
});

app.listen(port, () => {
  console.log(`✅ Server is running on http://localhost:${port}`);
});
