import { NextRequest, NextResponse } from "next/server";
import { getDataFromToken } from "@/app/(lib)/getDataFromToken";
import Message from "@/app/models/message.model";
import dbConnect from "@/dbConfig/dbConfig";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    await dbConnect();

    const tokenData = await getDataFromToken(request);
    if (!tokenData?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = tokenData.userId;
    const { messageId } = params;

    console.log("userId : ", userId);
    console.log("messageId : ", messageId);

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }

    // Update message seen status
    const updatedMessage = await Message.findOneAndUpdate(
      {
        _id: messageId,
        receiver: userId, // Only update if the current user is the receiver
        seen: false // Only update if message hasn't been seen yet
      },
      {
        $set: { seen: true }
      },
      { new: true }
    );

    if (!updatedMessage) {
      return NextResponse.json(
        { message: "Message not found or already seen" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Message status updated successfully",
      updatedMessage
    });

  } catch (error: any) {
    console.error("Error updating message status:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
