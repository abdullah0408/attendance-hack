import { NextResponse } from "next/server";
import axios from "axios";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const response = await axios.post(
      "https://student.bennetterp.camu.in/login/validate",
      {
        dtype: "M",
        Email: email,
        pwd: password,
      }
    );

    console.log(response.data.output.data.logindetails);
    console.log("Cookie from response:", response.headers["set-cookie"]);

    if (response.data && response.data.output.data.logindetails) {
      await prisma.user.upsert({
        where: { clerkId },
        update: {
          email,
          password,
          userData: response.data.output.data.logindetails,
          stuID: response.data.output.data.logindetails.Student[0].StuID,
          cookie: response.headers["set-cookie"]?.join("; "),
        },
        create: {
          clerkId,
          email,
          password,
          userData: response.data.output.data.logindetails,
          stuID: response.data.output.data.logindetails.Student[0].StuID,
          cookie: response.headers["set-cookie"]?.join("; "),
        },
      });
      return NextResponse.json({
        message: "Correct credentials",
        userData: response.data.output.data.logindetails,
        data: response.data,
      });
    } else {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
