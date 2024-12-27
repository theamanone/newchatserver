// src/app/api/v1/user/logout.ts
import { getDataFromToken } from "@/app/(lib)/getDataFromToken";
import { NextRequest, NextResponse } from "next/server";
import User from "@/app/models/user.model";

export async function POST(request: NextRequest) {
  try {
    // Get userId and deviceId from the token
    let userId = null;
    let deviceId = null;

    try {
      const data = await getDataFromToken(request); // Assuming this returns userId and deviceId or throws an error
      userId = data.userId;
      deviceId = data.deviceId;
    } catch (error) {
      console.error("Token verification failed:", error);
      // Token verification failed, logging out the user by clearing cookies
      const response = NextResponse.json(
        { message: "Token verification failed or token not found. Forced logout." },
        { status: 201 }
      );
      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");
      return response;
    }


    if (deviceId && userId) {
    // Find the user in the database
    const user: any = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    // Handle logout based on whether a deviceId is provided
      // Find the session with the specific deviceId
      const sessionIndex = user.sessions.findIndex((session: any) => session.deviceId === deviceId);

      if (sessionIndex !== -1) {
        // If session found, remove it (log out from that specific session)
        user.sessions.splice(sessionIndex, 1);
        await user.save();
        
        // Clear cookies for accessToken and refreshToken
        const response = NextResponse.json(
          { message: `Logged out from session with deviceId: ${deviceId}` },
          { status: 200 }
        );

        response.cookies.delete("accessToken"); // Clear accessToken cookie
        response.cookies.delete("refreshToken"); // Clear refreshToken cookie

        return response;
      } else {
        // If session not found, return message but do not affect other sessions
        const response = NextResponse.json(
          { message: "Session not found for this device. || logged out success !" },
          { status: 201 }
        );

        // Clear cookies for accessToken and refreshToken, even if the session was not found
        // response.cookies.delete("accessToken"); 
        // response.cookies.delete("refreshToken");

        return response;
      }
    } else {
      // If no deviceId provided, return a response indicating no session was affected
      const response = NextResponse.json(
        { message: "No deviceId provided. No session was affected." },
        { status: 400 }
      );

      // Clear cookies for accessToken and refreshToken when no deviceId is provided
      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");

      return response;
    }
  } catch (error) {
    console.error("Error during logout:", error);
    return NextResponse.json({ message: "An error occurred during logout." }, { status: 500 });
  }
}
