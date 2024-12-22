import dbConnect from "@/dbConfig/dbConfig";
import Conversation from "@/app/models/conversation.model";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import { getDataFromToken } from "@/app/(lib)/getDataFromToken";
import Message from "@/app/models/message.model";
import Group from "@/app/models/group.model";
import mongoose from "mongoose";

interface User {
  _id: string;
  username: string;
  avatar: string;
}

interface Message {
  content: string;
  messageType: string;
  timestamp: Date;
  sender: User;
  deletedBy: string[];
}

interface Conversation {
  _id: string;
  participants: User[];
  latestMessage: Message | null;
}

interface ProcessedConversation {
  type: "chat";
  conversation_id: string;
  user1_id: string;
  user2_id: string | undefined;
  otherUser: {
    user_id: string | undefined;
    username: string;
    avatar: string;
  };
  lastMessage: {
    content: string;
    messageType: string;
    timestamp: Date;
    sender: {
      _id: string;
      username: string;
      avatar: string;
    };
  } | null;
}

// Helper Function to Get Conversations
const getConversations = async (userId: string) => {
  return await Conversation.find({
    participants: userId,
    deletedBy: { $ne: userId },
  })
    .populate({
      path: "participants",
      model: User,
      select: "_id username avatar", // Select only the fields you need
    })
    .populate({
      path: "latestMessage",
      model: Message,
      populate: { path: "sender receiver" }, // Further populate sender and receiver
    });
};

// Helper Function to Get Groups with Latest Messages
const getGroupsWithMessages = async (userId: string) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Fetch groups with messages where user is a member
  const groupsWithMessages = await Group.aggregate([
    // First match groups where the user is a member
    {
      $match: {
        memberIds: userObjectId,
        isDeleted: false
      }
    },
    // Lookup members
    {
      $lookup: {
        from: "users",
        localField: "memberIds",
        foreignField: "_id",
        as: "members"
      }
    },
    // Lookup last message
    {
      $lookup: {
        from: "messages",
        let: { groupId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$groupId", "$$groupId"] } } },
          { $sort: { timestamp: -1 } },
          { $limit: 1 }
        ],
        as: "lastMessage"
      }
    },
    { $unwind: { path: "$lastMessage", preserveNullAndEmptyArrays: true } },
    // Lookup sender of last message
    {
      $lookup: {
        from: "users",
        localField: "lastMessage.sender",
        foreignField: "_id",
        as: "lastMessageSender"
      }
    },
    { $unwind: { path: "$lastMessageSender", preserveNullAndEmptyArrays: true } },
    // Project final format
    {
      $project: {
        _id: 1,
        type: { $literal: "group" },
        group_id: "$_id",
        groupName: "$name",
        members: {
          $filter: {
            input: {
              $map: {
                input: "$members",
                as: "member",
                in: {
                  user_id: "$$member._id",
                  username: "$$member.username",
                  avatar: { $ifNull: ["$$member.avatar", ""] }
                }
              }
            },
            as: "member",
            cond: { $ne: ["$$member.user_id", userObjectId] }
          }
        },
        lastMessage: {
          $cond: {
            if: { $eq: ["$lastMessage", null] },
            then: { sender: {} },
            else: {
              content: { $ifNull: ["$lastMessage.content", ""] },
              messageType: "$lastMessage.messageType",
              timestamp: "$lastMessage.timestamp",
              sender: {
                _id: "$lastMessageSender._id",
                username: "$lastMessageSender.username",
                avatar: { $ifNull: ["$lastMessageSender.avatar", ""] }
              }
            }
          }
        }
      }
    },
    // Sort by last message timestamp
    {
      $sort: {
        "lastMessage.timestamp": -1
      }
    }
  ]);

  return groupsWithMessages;
};

// Helper Function to Process and Filter Conversations
const processConversations = async (
  conversations: Conversation[],
  userId: string
): Promise<ProcessedConversation[]> => {
  const processedConversations = await Promise.all(
    conversations.map(async (conversation) => {
      // Find the other user in the conversation
      const otherUser = conversation.participants.find(
        (participant) => participant._id.toString() !== userId
      );

      // Skip conversations with unknown users
      if (!otherUser || otherUser._id === "unknown") {
        return null;
      }

      // Check if the latest message is deleted by the current user
      const lastMessage =
        conversation.latestMessage &&
        !conversation.latestMessage.deletedBy.includes(userId)
          ? conversation.latestMessage
          : // If the latest message is deleted, find the most recent non-deleted message
          await Message.findOne({
            conversation: conversation._id,
            deletedBy: { $ne: userId },
          })
            .sort({ timestamp: -1 })
            .populate('sender', '_id username avatar');

      return {
        type: "chat",
        conversation_id: conversation._id,
        user1_id: userId,
        user2_id: otherUser._id,
        otherUser: {
          user_id: otherUser._id,
          username: otherUser.username,
          avatar: otherUser.avatar || "/assets/fallback/default-avatar.svg",
        },
        lastMessage: lastMessage
          ? {
            content: lastMessage.content,
            messageType: lastMessage.messageType,
            timestamp: lastMessage.timestamp,
            sender: {
              _id: lastMessage.sender._id,
              username: lastMessage.sender.username,
              avatar: lastMessage.sender.avatar || "",
            },
          }
          : null,
      };
    })
  );

  // Filter out null values (unknown conversations)
  return processedConversations.filter((conv): conv is ProcessedConversation => conv !== null);
};

// Main API Route Handler
export async function GET(request: NextRequest) {
  await dbConnect();
  try {
    const { userId, error, status } = await getDataFromToken(request); // Get user ID from token

    if (error) {
      return new Response(JSON.stringify({ message: error }), { status })
    }

    // Fetch conversations and groups concurrently
    const [conversations, groupsWithMessages] = await Promise.all([
      getConversations(userId),
      getGroupsWithMessages(userId),
    ]);

    // console.log("conversations (* : "  , conversations)
    // console.log("groupsWithMessages (* : "  , groupsWithMessages)

    // Process individual conversations
    const filteredConversations = await processConversations(conversations, userId);

    // Combine individual conversations and group conversations
    const combinedConversations = [
      ...filteredConversations,
      ...groupsWithMessages,
    ];

    return NextResponse.json({ conversations: combinedConversations }, { status: 200 });
  } catch (error) {
    console.error("Error retrieving conversations:", error);
    return NextResponse.json({ message: "Error retrieving conversations" }, { status: 500 });
  }
}

// Create new conversation
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Get current user from token
    const userId = await getDataFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get target user ID from request body
    const { userId: targetUserId } = await request.json();
    if (!targetUserId) {
      return NextResponse.json({ error: "Target user ID is required" }, { status: 400 });
    }

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      participants: {
        $all: [
          new mongoose.Types.ObjectId(userId),
          new mongoose.Types.ObjectId(targetUserId)
        ]
      }
    }).populate('participants', 'username avatar email');

    if (existingConversation) {
      // Return existing conversation
      const otherUser = existingConversation.participants.find(
        (p: any) => p._id.toString() !== userId
      );

      return NextResponse.json({
        conversation_id: existingConversation._id,
        type: "c",
        otherUser: {
          _id: otherUser._id,
          username: otherUser.username,
          avatar: otherUser.avatar,
          email: otherUser.email
        }
      });
    }

    // Create new conversation
    const newConversation = await Conversation.create({
      participants: [userId, targetUserId],
      type: "chat"
    });

    // Populate participant details
    const populatedConversation = await Conversation.findById(newConversation._id)
      .populate('participants', 'username avatar email');

    const otherUser = populatedConversation.participants.find(
      (p: any) => p._id.toString() !== userId
    );

    return NextResponse.json({
      conversation_id: newConversation._id,
      type: "c",
      otherUser: {
        _id: otherUser._id,
        username: otherUser.username,
        avatar: otherUser.avatar,
        email: otherUser.email
      }
    });

  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
