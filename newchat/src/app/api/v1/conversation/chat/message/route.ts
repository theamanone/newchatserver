// src/app/api/v1/chat/messages/[userId].ts
import dbConnect from "@/dbConfig/dbConfig";
import Message from "@/app/models/message.model";
import { NextRequest, NextResponse } from "next/server";
import { getDataFromToken } from "@/app/(lib)/getDataFromToken";
import mongoose from "mongoose";

dbConnect();

export async function GET(request: NextRequest) {
  try {
    // Parse request parameters
    const url = new URL(request.url);
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const type = searchParams.get("type"); // "private" or "gc"
    const targetId = searchParams.get("target_id"); // receiverId or groupId
    const { userId } = await getDataFromToken(request);

    // console.log(" type : ", type)
    // console.log(" targetId : ", targetId)
    // console.log("user id : ", userId)

    // Validate userId from token
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return NextResponse.json({ message: "Invalid or missing token" }, { status: 401 });
    }

    // Validate targetId
    if (!targetId || !mongoose.isValidObjectId(targetId)) {
      return NextResponse.json({ message: "Invalid target ID" }, { status: 400 });
    }

    // Pagination setup
    const skip = (page - 1) * limit;

    // Define query based on message type
    let messagesQuery;
    if (type === "gc") {
      messagesQuery = Message.find({
        groupId: targetId,
        isGroup: true,
        isDeleted: false,
        deletedBy: { $ne: userId },
      });
    } else {
      if (userId === targetId) {
        return NextResponse.json({ message: "Sender and receiver cannot be the same" }, { status: 400 });
      }
      messagesQuery = Message.find({
        $or: [
          { sender: userId, receiver: targetId },
          { sender: targetId, receiver: userId },
        ],
        isGroup: false,
        isDeleted: false,
        deletedBy: { $ne: userId },
      });
    }

    // Execute query with pagination, sorting, and population
    const messages = await messagesQuery
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "username")
      .populate("replyToMessageId")
      .lean();

    if (!messages) {
      throw new Error("No messages found");
    }

    // Clone the query for countDocuments to avoid reusing an executed query
    const totalMessages = await Message.countDocuments(messagesQuery.getQuery());
    const totalPages = Math.ceil(totalMessages / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Process messages with isYour and reply details
    const messagesWithAdditionalInfo = messages.map((msg) => {
      const senderId = msg.sender._id.toString();
      const isYour = senderId === userId.toString();
      const status = type === "gc" ? msg.status.map((s: any) => ({
        userId: s.userId,
        status: s.userId.toString() === userId.toString() ? "read" : s.status,
      })) : msg.status;

      const replyContent = msg.replyToMessageId
        ? {
            messageId: msg.replyToMessageId._id,
            content: msg.replyToMessageId.content,
            sender: msg.replyToMessageId.sender,
          }
        : null;

      return {
        ...msg,
        isYour,
        replyContent,
        status,
      };
    });

    return NextResponse.json(
      {
        messages: messagesWithAdditionalInfo.reverse(),
        pagination: {
          currentPage: page,
          totalPages,
          hasNextPage,
          hasPreviousPage,
        },
      },
      { status: 200 }
    );
  } catch (error:any) {
    console.error("Error retrieving messages:", error.message, error.stack);
    return NextResponse.json(
      { message: `Error retrieving messages: ${error.message}` },
      { status: 500 }
    );
  }
}
