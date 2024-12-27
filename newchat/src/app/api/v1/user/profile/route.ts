// src/app/api/v1/user/profile.ts
import dbConnect from "@/dbConfig/dbConfig";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";

dbConnect();

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("accessToken")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = verify(token, process.env.ACCESS_TOKEN_SECRET!);
    
    const {userId}  = decoded.id; // Extract the user ID from the token

    const user = await User.findById(userId).select("-password"); // Exclude password from the response
    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Error in get user profile route:", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
