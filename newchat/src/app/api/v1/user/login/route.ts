import User from "@/app/models/user.model";
import dbConnect from "@/dbConfig/dbConfig";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
  await dbConnect()
    try {
      const reqBody = await request.json();
      const { emailOrUsername, password } = reqBody;

  
      // Validate input
      if (!emailOrUsername || !password) {
        return NextResponse.json(
          { message: "Username/Email and password are required." },
          { status: 400 }
        );
      }
  
      // Check if the user exists
      const user = await User.findOne({
        $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
      });
  
      if (!user) {
        return NextResponse.json(
          { message: "User does not exist." },
          { status: 404 }
        );
      }
  
      // Compare the provided password with the hashed password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { message: "Invalid credentials." },
          { status: 401 }
        );
      }
  
      // Generate access and refresh tokens
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();
  
      // Set cookies (you can adjust the options as necessary)
      const response = NextResponse.json(
        { message: "Login successful.", accessToken, refreshToken },
        { status: 200 }
      );
  
      const cookieOptions: any = {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 1 day for access token
      };
      response.cookies.set("accessToken", accessToken, cookieOptions);
      response.cookies.set("refreshToken", refreshToken, { ...cookieOptions, maxAge: 60 * 60 * 24 * 10 }); // 10 days for refresh token
  
      return response;
    } catch (error) {
      console.error("Error in login route:", error);
      return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
  }
  