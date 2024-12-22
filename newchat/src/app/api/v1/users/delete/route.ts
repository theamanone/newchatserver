import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/dbConfig/dbConfig";
import User from "@/app/models/user.model";
import Message from "@/app/models/message.model";
import { getDataFromToken } from "@/app/(lib)/getDataFromToken";


export async function DELETE(request: NextRequest) {
  await dbConnect();
  try {
    // Get user ID from token
    const userId = await getDataFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Delete all user messages
    await Message.deleteMany({ sender: userId });

    // Remove user from all chat groups
    // This will depend on your Group model implementation
    // You might need to update group members lists

    // Clear all user sessions
    await user.clearAllSessions();

    // Delete user account
    await User.findByIdAndDelete(userId);

    return NextResponse.json(
      { message: "User account deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting user account:", error);
    return NextResponse.json(
      { error: "Error deleting user account" },
      { status: 500 }
    );
  }
}
