import { NextRequest, NextResponse } from "next/server";
import SuspendedUser from "@/app/models/suspendedUser.model";
import dbConnect from "@/dbConfig/dbConfig";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, reason } = body;

    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user is already suspended
    const existingSuspension = await SuspendedUser.findOne({ userId });
    if (existingSuspension) {
      return new NextResponse(
        JSON.stringify({ error: "User is already blocked" }),
        { status: 400 }
      );
    }

    // Create suspension record
    const suspension = new SuspendedUser({
      userId,
      reason: reason || 'Blocked by superadmin',
      suspendedAt: new Date(),
      suspendedBy: 'superadmin'
    });

    await suspension.save();

    return new NextResponse(
      JSON.stringify({ message: "User blocked successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in POST /api/v1/superadmin/users/block:', error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400 }
      );
    }

    await dbConnect();

    await SuspendedUser.findOneAndDelete({ userId });

    return new NextResponse(
      JSON.stringify({ message: "User unblocked successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/v1/superadmin/users/block:', error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}
