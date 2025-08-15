import axios from "axios";

export async function sendWaMessage(phoneNumber: string, message: string) {
  try {
    await axios.post(
      process.env.NEXT_PUBLIC_WHATSAPP_SEND_MESSAGE_URL!,
      {
        phoneNumber,
        message,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`Message sent to ${phoneNumber}: ${message}`);
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
  }
}
