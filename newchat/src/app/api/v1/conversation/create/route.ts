// src/app/api/v1/chat/conversations/create.ts
import dbConnect from "@/dbConfig/dbConfig";
import Conversation from "@/app/models/conversation.model";
import Message from "@/app/models/message.model"; // Import the Message model
import { NextRequest, NextResponse } from "next/server";
import { getDataFromToken } from "@/app/(lib)/getDataFromToken";

dbConnect();

export async function POST(request: NextRequest) {
  try {
    // Parse the request body to get the receiver's ID
    const { receiverId } = await request.json();
    const senderId = await getDataFromToken(request); // Get the sender's ID from the token

    // Check if a conversation already exists between the two users
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] }, // Match for existing conversation between sender and receiver
    });

    let messages = [];

    // If the conversation exists, fetch the messages
    if (conversation) {
      messages = await Message.find({
        $or: [
          { sender: senderId, receiver: receiverId },
          { sender: receiverId, receiver: senderId },
        ],
        deletedBy: { $ne: senderId }, // Exclude messages deleted by the current user
      })
      .sort({ timestamp: 1 }) // Sort by timestamp to get the conversation history
      .exec();

      // Return the existing conversation and its messages with a 200 status
      return NextResponse.json({ conversation, messages }, { status: 200 });
    } else {
      // If the conversation doesn't exist, create a new one
      conversation = await Conversation.create({
        participants: [senderId, receiverId], // Both sender and receiver
        latestMessage: null, // Initially, no message in the conversation
      });

      // Return the new conversation with a 201 status
      return NextResponse.json({ conversation, messages: [] }, { status: 201 });
    }

  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json({ message: "Error creating conversation" }, { status: 500 });
  }
}
