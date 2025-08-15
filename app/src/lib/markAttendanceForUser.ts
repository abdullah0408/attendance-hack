import axios from "axios";
import { sendEmail } from "./sendMail";
import { User } from "@/generated/prisma";

export async function markAttendanceForUser(user: User, qrValue: string) {
  if (!user.inUse || !user.stuID || !user.cookie) return;

  try {
    const response = await axios.post(
      process.env.NEXT_PUBLIC_RECORD_ATTENDANCE_URL!,
      {
        attendanceId: qrValue,
        StuID: user.stuID,
        offQrCdEnbld: true,
      },
      {
        headers: {
          Cookie: user.cookie,
        },
      }
    );

    if (
      response.data &&
      JSON.stringify(response.data).includes("ATTENDANCE_NOT_VALID")
    ) {
      console.log(`Attendance not valid for ${user.stuID}:`, response.data);
      sendEmail(user.email, "failed");
    } else {
      console.log(`Attendance marked for ${user.stuID}:`, response.data);
      sendEmail(user.email, "success");
    }
  } catch (error) {
    console.error(`Error marking attendance for ${user.stuID}:`, error);
    sendEmail(user.email, "failed");
  }
}
