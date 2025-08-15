import { prisma } from "@/lib/prisma";
import { markAttendanceForUser } from "@/lib/markAttendanceForUser";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { qrValue } = await request.json();

    if (!qrValue) {
      return NextResponse.json(
        { error: "Missing QR code value" },
        { status: 400 }
      );
    }

    const users = await prisma.user.findMany({
      where: { inUse: true },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: "No active users found" },
        { status: 404 }
      );
    }

    await Promise.all(
      users.map((user) => markAttendanceForUser(user, qrValue))
    );

    return NextResponse.json(
      { success: true, message: "Attendance marked successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error marking attendance:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
