import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Group from "@/app/models/group.model";
import User from "@/app/models/user.model";
import Conversation from "@/app/models/conversation.model";
import { getDataFromToken } from "@/app/(lib)/getDataFromToken";

export async function POST(request: NextRequest) {
  try {
    const { name, memberIds } = await request.json();

    // Get the user's ID from the token for authentication
    const { userId } = await getDataFromToken(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // Validate group name and memberIds
    if (!name || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: "Group name and members are required." }, { status: 400 });
    }

    // Check if each member has an active conversation with the requesting user
    const validMemberIds = await Promise.all(
      memberIds.map(async (memberId) => {
        const conversation = await Conversation.findOne({
          participants: { $all: [userId, memberId] },
        });
        return conversation ? memberId : null;
      })
    );

    // Filter out invalid members who do not have a conversation with the user
    const filteredMemberIds = validMemberIds.filter(Boolean) as mongoose.Types.ObjectId[];
    
    if (filteredMemberIds.length !== memberIds.length) {
      return NextResponse.json({ error: "Some members do not have an existing conversation with you." }, { status: 400 });
    }

    // Create the group with validated members
    const group = await Group.create({
      name,
      adminIds: [userId], // The creator is the admin
      memberIds: [...filteredMemberIds, userId], // Include the creator in memberIds
    });

    // Add the group ID to chatGroups array for all members including the creator
    await User.updateMany(
      { _id: { $in: [...filteredMemberIds, userId] } },
      { $addToSet: { chatGroups: group._id } }
    );

    return NextResponse.json({ 
      message: "Group created successfully", 
      group 
    }, { status: 201 });
  } catch (error) {
    console.error("Group creation failed:", error);
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }
}
