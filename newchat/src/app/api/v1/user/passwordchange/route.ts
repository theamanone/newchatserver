// src/app/api/v1/user/changePassword.ts
import dbConnect from "@/dbConfig/dbConfig";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";

dbConnect();

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("accessToken")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = verify(token, process.env.ACCESS_TOKEN_SECRET!);
    const {userId}  = decoded.id;

    const reqBody = await request.json();
    const { currentPassword, newPassword } = reqBody;

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: "Both current and new passwords are required." }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    // Compare the provided password with the hashed password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return NextResponse.json({ message: "Invalid current password." }, { status: 401 });
    }

    // Update the password
    user.password = newPassword; // Password will be hashed in the pre-save hook
    await user.save();

    return NextResponse.json({ message: "Password changed successfully." }, { status: 200 });
  } catch (error) {
    console.error("Error in change password route:", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
