import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import FormData from "form-data";
import { prisma } from "@/lib/prisma";
import { markAttendanceForUser } from "@/lib/markAttendanceForUser";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image");

    if (!file || typeof file === "string" || !("arrayBuffer" in file)) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const qrForm = new FormData();
    qrForm.append("file", buffer, {
      filename: file.name,
      contentType: file.type,
    });

    const qrResponse = await axios.post(
      process.env.NEXT_PUBLIC_QR_SCANNING_SERVICE_URL!,
      qrForm,
      {
        headers: qrForm.getHeaders(),
        timeout: 10000,
        maxContentLength: 5 * 1024 * 1024,
        maxBodyLength: 5 * 1024 * 1024,
      }
    );

    const result = qrResponse.data;

    if (
      !Array.isArray(result) ||
      !result[0]?.symbol ||
      !Array.isArray(result[0].symbol)
    ) {
      console.error("Invalid QR response:", result);
      return NextResponse.json(
        {
          message: "Image received successfully but QR code could not be read",
        },
        { status: 202 }
      );
    }

    const qrValue = result[0].symbol[0]?.data;

    if (!qrValue || typeof qrValue !== "string") {
      console.error("No QR value found");
      return NextResponse.json(
        {
          message: "Image received successfully but QR code could not be read",
        },
        { status: 202 }
      );
    }

    if (qrValue.length > 100) {
      console.error(
        `QR value too long (${qrValue.length} chars), discarding:`,
        qrValue.substring(0, 50)
      );
      return NextResponse.json(
        {
          message: "Image received successfully but QR code value is too long",
        },
        { status: 202 }
      );
    }

    console.log("QR value successfully read:", qrValue);

    const users = await prisma.user.findMany({
      where: { inUse: true },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!users || users.length === 0) {
      return NextResponse.json(
        {
          message: "Image received successfully but no active users found",
        },
        { status: 202 }
      );
    }

    await Promise.all(
      users.map((user) => markAttendanceForUser(user, qrValue))
    );

    return NextResponse.json(
      { message: "Image received successfully and processed completely" },
      { status: 200 }
    );
  } catch (err) {
    console.error("QR processing error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
