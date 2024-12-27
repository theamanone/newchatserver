import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { generateAccessAndRefereshTokens } from "@/app/(lib)/generateAccessAndRefereshTokens";
import User from "@/app/models/user.model";
import { sanitizeUser } from "@/app/(lib)/sanitizeuser";
import { encrypt } from "@/utils/encryption";

// Refresh Token API
export async function POST(request: NextRequest) {
  try {
    const authRefreshUserSession = request.headers.get("refreshToken");

    // Check if token comes from cookie or header
    const incomingToken: any = authRefreshUserSession?.split(" ")[1]; // remove 'Bearer'

    if (!incomingToken) {
      return NextResponse.json(
        { error: "Refresh token is required" },
        { status: 403 }
      );
    }
    // Verify the refresh token
    let decoded: any;
    try {
      decoded =  jwt.verify(incomingToken, process.env.REFRESH_TOKEN_SECRET!);
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 403 }
      );
    }

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    // Find user by ID in the decoded token
    const user = await User.findById(decoded.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 403 });
    }

    // Generate new access and refresh tokens
    // const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    //   user._id
    // );

    // Define secure options for setting cookies
    const sanitizedUser = sanitizeUser(user);
    const encryptedUserData = encrypt(sanitizedUser, process.env.AES_KEY!);
    // Create response with new tokens
    const response = NextResponse.json({
      // accessToken: accessToken,
      // refreshToken: refreshToken,
      d: encryptedUserData,
      has_alg: "alight - AES-GCM ",
      ss_event: true,
      success: true,
    });
    const cookieOptions: any = {
      httpOnly: true,
      secure: false,
    };
    // response.cookies.set("accessToken", accessToken, cookieOptions);
    // response.cookies.set("refreshToken", refreshToken, cookieOptions);

    return response;
  } catch (error: any) {
    console.error("Error while refreshing token:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
