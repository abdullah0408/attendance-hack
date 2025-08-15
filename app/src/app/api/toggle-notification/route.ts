import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { getNotification }: { getNotification: boolean } = await req.json();
  if (typeof getNotification !== "boolean") {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  try {
    await prisma.user.update({
      where: {
        clerkId: userId,
      },
      data: {
        getNotification,
      },
    });

    return NextResponse.json({ message: "Success" });
  } catch (error) {
    console.error("Error updating user notification preference:", error);
    return NextResponse.json(
      { error: "Failed to update notification preference" },
      { status: 500 }
    );
  }
}
