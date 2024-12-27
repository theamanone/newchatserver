import dbConnect from "@/dbConfig/dbConfig";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/app/(lib)/mailer";


export async function POST(request: NextRequest) {
    await dbConnect();
    try {
    const reqBody = await request.json();
    const { email } = reqBody;

    // Step 1: Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Step 2: Check if the user is already verified
    if (user.isVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      );
    }

    // Step 3: Resend verification email
    await sendEmail({
      email: user.email,
      emailType: "VERIFY",
      userId: user._id.toString(),
    });

    return NextResponse.json(
      { message: "Verification email sent successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in resending verification email:", error);
    return NextResponse.json(
      { message: "Something went wrong", error: error.message },
      { status: 500 }
    );
  }
}
