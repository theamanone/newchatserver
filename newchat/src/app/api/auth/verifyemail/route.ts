import dbConnect from "@/dbConfig/dbConfig";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";

dbConnect();

export async function POST(request: NextRequest) {
  try {
    // Step 1: Log the incoming request body
    const reqBody = await request.json();
    const { token } = reqBody;

    // Step 2: Check if token exists and query the database
    // console.log("Received token: ", token);
    const user = await User.findOne({
      verificationToken: token,
    });

    // Step 3: Check if user was found
    if (!user) {
      // console.log("No user found for this token.");
      return NextResponse.json(
        { error: "Invalid token!", email: null },
        { status: 400 }
      );
    }

    // Step 4: Check if the verification token is expired
    if (
      user.verificationTokenExpires &&
      user.verificationTokenExpires < Date.now()
    ) {
      // console.log("Token expired for user:", user.email);
      return NextResponse.json(
        { error: "Token expired!", status: 401, email: user.email },
        { status: 401 }
      );
    }

    // console.log("User found:", user);

    // Step 5: Proceed to update the user document and log the update
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    await user.save();
    // console.log("User verification status updated and saved.");

    return NextResponse.json(
      { message: "Email verified successfully", success: true },
      { status: 200 }
    );
  } catch (error: any) {
    // Step 6: Log any errors that occur during the process
    console.error("Error during email verification:", error);
    return NextResponse.json(
      { message: "Something went wrong", error: error.message },
      { status: 500 }
    );
  }
}
