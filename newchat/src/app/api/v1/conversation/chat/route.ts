import dbConnect from "@/dbConfig/dbConfig";
import Message from "@/app/models/message.model";
import Conversation from "@/app/models/conversation.model";
import { getDataFromToken } from "@/app/(lib)/getDataFromToken";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import Group from "@/app/models/group.model";
import { uploadFileToAPI } from "@/utils/fileStorage";

// Connect to the database
dbConnect();

// Handle POST requests
export async function POST(request: NextRequest) {
  // console.log("Incoming POST request to /api/v1/conversation/chat");

  try {
    // Use FormData to handle file uploads
    const formData = await request.formData();
    const receiver = formData.get("receiver");
    const message = formData.get("message") || "";
    const messageType = formData.get("messageType");

    const groupId = formData.get("groupId"); // Get groupId if it's a group message
    const isGroup = formData.get("isGroup") === "true"; // Check if it's a group message

    const { userId } = await getDataFromToken(request); // Get the sender's ID from the token

    if (!userId) {
      return NextResponse.json({ message: "Sender is missing" }, { status: 400 });
    }

    console.log("Sender ID:", userId);
    console.log("Receiver ID:", receiver);
    console.log("Message content:", message);
    console.log("Message type:", messageType);
    console.log("group id : ", groupId)
    console.log("is Group : ", isGroup)
    console.log("user Id : ", userId)

    // Handle file uploads
    let mediaUrl = null;
    const file: any = formData.get("file_0"); // Get the first file

    if (file) {
      try {
        // Convert File object to temporary file
        const tempDir = path.join(process.cwd(), 'temp');
        fs.mkdirSync(tempDir, { recursive: true });
        const tempFilePath = path.join(tempDir, file.name);
        
        // Write the file temporarily
        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(tempFilePath, buffer);

        // Upload to external storage
        // console.log("try to upload file on another api ")
        const uploadResponse = await uploadFileToAPI(file);
        // console.log("first file upload response : ", uploadResponse);
        mediaUrl = uploadResponse?.data?.url; // Adjust according to your API response structure
      } catch (error) {
        console.error("Error uploading file:", error);
        return NextResponse.json(
          { message: "Failed to upload file" },
          { status: 500 }
        );
      }
    }

    // Prepare the message status array
    const messageStatus = [
      {
        userId: receiver,
        status: "sent", 
        timestamp: new Date(),
      },
    ];

    // console.log("mediaUrl : " , mediaUrl)
    if (file && !mediaUrl) {
      return NextResponse.json({ message: "Message content is required" }, { status: 400 });
    }

    
    // Create a new message
    const newMessage = new Message({
      sender: userId,
      receiver: isGroup ? undefined : receiver,
      groupId: isGroup ? groupId : undefined,
      isGroup,
      content: message,
      messageType,
      status: messageStatus,
      mediaUrl: mediaUrl ? mediaUrl : null,
      deletedBy: [],
      isDeleted: false,
      isEncrypted: true,
      timestamp: new Date(),
    });

    // Save the new message
    const savedMessage = await newMessage.save();
    // console.log("Message saved successfully:", savedMessage);

    // Find or create a conversation
    let conversation = null;
    if (isGroup) {
      // For group messages, the conversation is identified by groupId
      conversation = await Group.findOne({ _id: groupId });

      // Check if message sending is allowed
      if (!conversation.canSendMessages && !conversation.adminIds.includes(userId)) {
        return NextResponse.json(
          { message: "Message sending is not allowed for this group" },
          { status: 403 }
        );
      }

      if (!conversation) {
        // Create a new group conversation if it doesn't exist
        // console.log("New group conversation created:", conversation);
        return NextResponse.json(
          { message: "Group not found" },
          { status: 404 }
        );
      } else {
        // Update the latest message for the group conversation
        // conversation.latestMessage = savedMessage._id;
        // await conversation.save();
        // console.log("Group conversation updated:", conversation);
      }
    } else {
      // For user-to-user conversations, use sender and receiver
      conversation = await Conversation.findOne({
        participants: { $all: [userId, receiver] },
      });

      if (conversation) {
        // If the receiver is in the deletedBy array, remove them
        if (conversation.deletedBy.includes(receiver)) {
          conversation.deletedBy = conversation.deletedBy.filter(
            (id: any) => id.toString() !== receiver?.toString()
          );
          // console.log(`Removed receiver ID from deletedBy: ${receiver}`);
        }

        // Update the latest message
        conversation.latestMessage = savedMessage._id;
        await conversation.save();
        // console.log("Existing conversation updated:", conversation);
      } else {
        // Create a new conversation if it doesn't exist
        conversation = await Conversation.create({
          participants: [userId, receiver],
          latestMessage: savedMessage._id,
        });
        // console.log("New conversation created:", conversation);
      }
    }

    // Return success response with the saved message
    return NextResponse.json(
      { message: "Message sent successfully", data: savedMessage },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in sending message:", error);
    return NextResponse.json(
      { message: "Error sending message" },
      { status: 500 }
    );
  }
}
