import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { inUse } = await request.json();

    if (typeof inUse !== "boolean") {
      return NextResponse.json(
        { error: "Invalid inUse value" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { clerkId },
      data: { inUse },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error updating user automation status:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
