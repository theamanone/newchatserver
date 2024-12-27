import dbConnect from "@/dbConfig/dbConfig";
import Conversation from "@/app/models/conversation.model";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import { getDataFromToken } from "@/app/(lib)/getDataFromToken";
import Message from "@/app/models/message.model";
import Group from "@/app/models/group.model";  // Assuming you have a Group model
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

  // Fetch active groups where the user is a member
  const groups = await Group.find({
    memberIds: userObjectId,
    isDeleted: false,
  })
    .populate({
      path: "memberIds",
      model: User,
      select: "_id username avatar",
    });

  // Fetch last message for each group
  const groupsWithMessages = await Group.aggregate([
    { $match: { isDeleted: false } },
    {
      $lookup: {
        from: "users",
        localField: "memberIds",
        foreignField: "_id",
        as: "members",
      },
    },
    {
      $lookup: {
        from: "messages",
        let: { groupId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$groupId", "$$groupId"] } } },
          { $sort: { timestamp: -1 } }, // Sort by latest timestamp
          { $limit: 1 },
        ],
        as: "lastMessage",
      },
    },
    { $unwind: { path: "$lastMessage", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "lastMessage.sender",
        foreignField: "_id",
        as: "lastMessageSender",
      },
    },
    { $unwind: { path: "$lastMessageSender", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        type: "group",
        group_id: "$_id",
        groupName: "$name",
        members: {
          $map: {
            input: "$members",
            as: "member",
            in: {
              user_id: "$$member._id",
              username: "$$member.username",
              avatar: "$$member.avatar",
            },
          },
        },
        lastMessage: {
          content: "$lastMessage.content",
          messageType: "$lastMessage.messageType",
          timestamp: "$lastMessage.timestamp",
          sender: {
            _id: "$lastMessage.sender",
            username: "$lastMessageSender.username",
            avatar: "$lastMessageSender.avatar",
          },
        },
      },
    },
  ]);

  return groupsWithMessages;
};

// Helper Function to Process and Filter Conversations
// Helper Function to Process and Filter Conversations
const processConversations = async (
  conversations: Conversation[],
  userId: string
): Promise<ProcessedConversation[]> => {
  return Promise.all(
    conversations.map(async (conversation) => {
      // Find the other user in the conversation
      const otherUser = conversation.participants.find(
        (participant) => participant._id.toString() !== userId
      );

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
        user2_id: otherUser?._id || "unknown",
        otherUser: {
          user_id: otherUser?._id || "unknown",
          username: otherUser?.username || "Unknown",
          avatar: otherUser?.avatar || "/assets/fallback/default-avatar.svg",
        },
        lastMessage: lastMessage
          ? {
            content: lastMessage.content,
            messageType: lastMessage.messageType,
            timestamp: lastMessage.timestamp,
            sender: {
              _id: lastMessage.sender._id,
              username: lastMessage.sender.username,
              avatar: lastMessage.sender.avatar,
            },
          }
          : null,
      };
    })
  );
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
