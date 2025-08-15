import { getTransporter } from "./email";

const transporter = await getTransporter();

export async function sendEmail(email: string, status: string) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: "Attendance marked status",
    text: `The status of your attendance is: ${status} at ${new Date().toLocaleString()}`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}
