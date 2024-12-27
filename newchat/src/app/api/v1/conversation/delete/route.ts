// src/app/api/v1/chat/conversations/delete/[userId].ts
import dbConnect from "@/dbConfig/dbConfig";
import Conversation from "@/app/models/conversation.model";
import Message from "@/app/models/message.model";
import { NextRequest, NextResponse } from "next/server";
import { getDataFromToken } from "@/app/(lib)/getDataFromToken";

dbConnect();
 
export async function DELETE(request: NextRequest) {
  try {
    const {userId} = await getDataFromToken(request); // Extract user ID from the token
    const searchParams = request.nextUrl.searchParams;
    const otherUserId = searchParams.get("otherUserId"); // Get the other user's ID from the query parameters

    // console.log("userid : ", userId);
    // console.log("otheruserid : ", otherUserId)
    if (!otherUserId) {
      return NextResponse.json({ message: "Other user ID is required" }, { status: 400 });
    }
    // Update the deletedBy array in the conversation
    const conversation = await Conversation.findOneAndUpdate(
      { participants: { $all: [userId, otherUserId] } }, // Find the conversation involving both users
      { $addToSet: { deletedBy: userId } }, // Add the userId to deletedBy without duplicates
      { new: true } // Return the updated document
    );

    // console.log("Updated conversation: ", conversation);

    // If both users have deleted the conversation, do not delete the conversation document
    // However, we can handle messages that have been deleted by this user
    // (This part of logic will vary depending on your application's requirement)

    // Optionally, you might want to mark messages as deleted for this user
    await Message.updateMany(
      {
        $or: [
          { sender: userId, receiver: otherUserId },
          { sender: otherUserId, receiver: userId }
        ],
        deletedBy: { $ne: userId }, // Ensure we don't add the user ID multiple times
      },
      {
        $addToSet: { deletedBy: userId }, // Add userId to the deletedBy field in messages
        $set: { isDeleted: true } // Optionally mark messages as deleted
      }
    );

    return NextResponse.json({ message: "Conversation marked as deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json({ message: "Error deleting conversation" }, { status: 500 });
  }
}
