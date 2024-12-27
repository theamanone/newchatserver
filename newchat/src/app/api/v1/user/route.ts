// src/app/api/v1/user/route.ts

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
    const { username, email, avatar } = reqBody;

    // Validate input
    if (!username && !email && !avatar) {
      return NextResponse.json({ message: "At least one field is required." }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    // Update fields if they are provided
    if (username) user.username = username;
    if (email) user.email = email;
    if (avatar) user.avatar = avatar;

    await user.save();

    return NextResponse.json({ message: "Profile updated successfully." }, { status: 200 });
  } catch (error) {
    console.error("Error in update user profile route:", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
