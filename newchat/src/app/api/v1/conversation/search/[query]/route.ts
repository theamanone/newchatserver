import dbConnect from "@/dbConfig/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import { getDataFromToken } from "@/app/(lib)/getDataFromToken";
import User from "@/app/models/user.model";
import Conversation from "@/app/models/conversation.model";
import Message from "@/app/models/message.model";
import mongoose from "mongoose";

export async function GET(request: NextRequest, { params }: { params: { query: string } }) {
  try {
    await dbConnect();
    const { userId } = await getDataFromToken(request);
    const { query: searchTerm } = params;
    
    if (!searchTerm) {
      return NextResponse.json({ message: "Search term cannot be empty" }, { status: 400 });
    }

    // Find users that match the search term (excluding the current user)
    const matchedUsers = await User.find({
      $and: [
        { username: { $regex: searchTerm, $options: "i" } }, // Case-insensitive search
        { _id: { $ne: new mongoose.Types.ObjectId(userId) } } // Exclude current user
      ]
    }).select("_id username avatar");

    // Find existing conversations with matched users
    const existingConversations = await Conversation.aggregate([
      {
        $match: {
          participants: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "participants",
          foreignField: "_id",
          as: "participantDetails"
        }
      },
      {
        $lookup: {
          from: "messages",
          let: { conversationId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$conversation", "$$conversationId"] } } },
            { $sort: { timestamp: -1 } },
            { $limit: 1 }
          ],
          as: "lastMessage"
        }
      },
      { $unwind: { path: "$lastMessage", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          participants: "$participantDetails",
          lastMessage: {
            content: "$lastMessage.content",
            messageType: "$lastMessage.messageType",
            timestamp: "$lastMessage.timestamp"
          }
        }
      }
    ]);

    // Process results
    const results = matchedUsers.map(user => {
      const existingConversation = existingConversations.find(conv => 
        conv.participants.some((p: any) => p._id.toString() === user._id.toString())
      );

      return {
        _id: user._id,
        username: user.username,
        avatar: user.avatar || "",
        type: "user",
        existingConversation: existingConversation ? {
          id: existingConversation._id,
          lastMessage: existingConversation.lastMessage
        } : null
      };
    });

    return NextResponse.json({ 
      results,
      count: results.length 
    }, { status: 200 });

  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { message: "Error processing search request" },
      { status: 500 }
    );
  }
}
