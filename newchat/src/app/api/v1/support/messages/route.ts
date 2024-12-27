import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/dbConfig/dbConfig";
import { getDataFromToken } from "@/app/(lib)/getDataFromToken";
import SupportMessage from "@/app/models/supportMessage.model";
import { uploadFileToAPI } from "@/utils/fileStorage";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const MAX_MESSAGE_LENGTH = 1000;

dbConnect();

export async function POST(request: Request) {
  try {
    let data: any = {};
    let file: any = null;
    let mediaUrl = null;
    let fileType = null;

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      file = formData.get("file_0");
      data = {
        receiver: formData.get("receiver"),
        message: formData.get("message") || "",
        messageType: formData.get("messageType"),
        replyToMessageId: formData.get("replyToMessageId"),
        userId: formData.get("userId"),
        isGroup: formData.get("isGroup") === "true"
      };
    } else {
      // Handle JSON data
      data = await request.json();
    }

    console.log("Received data:", {
      ...data,
      hasFile: !!file
    });

    const { receiver, message, messageType, userId } = data;

    if (!userId || !receiver) {
      return NextResponse.json(
        { error: "Sender and receiver are required" },
        { status: 400 }
      );
    }

    // Validate message length for text messages
    if (messageType === "text" && message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters allowed.` },
        { status: 400 }
      );
    }

    // Handle file upload if present
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "File size exceeds 15MB limit" },
          { status: 400 }
        );
      }

      try {
        const uploadResponse = await uploadFileToAPI(file);
        mediaUrl = uploadResponse?.data?.url;
        fileType = file.type;
      } catch (error) {
        console.error("Error uploading file:", error);
        return NextResponse.json(
          { error: "Failed to upload file" },
          { status: 500 }
        );
      }
    }

    if ((messageType === "file" || messageType === "voice") && !mediaUrl) {
      return NextResponse.json(
        { error: "Media file is required for file/voice messages" },
        { status: 400 }
      );
    }

    // Determine if sender is admin
    const isAdminSender = userId === 'xyxyadminid';
    
    // Determine receiver type based on the receiver format
    const isAdminReceiver = receiver === 'xyxyadminid';

    // Create message with status - convert ObjectId to string for status
    const messageStatus = [{
      userId: receiver.toString(), // Convert to string for consistency
      status: "sent",
      timestamp: new Date()
    }];

    const newMessage = new SupportMessage({
      sender: userId.toString(), // Convert to string for consistency
      receiver: receiver.toString(), // Convert to string for consistency
      receiverType: isAdminReceiver ? 'admin' : 'user',
      content: message,
      messageType,
      mediaUrl,
      fileType,
      replyToMessageId: data.replyToMessageId || null,
      status: messageStatus,
      timestamp: new Date()
    });

    const savedMessage = await newMessage.save();

    // Populate message for response
    const populatedMessage = await SupportMessage.findById(savedMessage._id)
      .populate(isAdminSender ? 'receiver' : 'sender', 'username email avatar')
      .populate('replyToMessageId', 'content sender');

    // Format response
    const response = {
      status: 'success',
      data: {
        _id: populatedMessage._id,
        content: populatedMessage.content,
        messageType: populatedMessage.messageType,
        mediaUrl: populatedMessage.mediaUrl,
        sender: isAdminSender ? {
          _id: 'xyxyadminid',
          username: 'Admin Support',
          avatar: '/admin.svg'
        } : populatedMessage.sender ? {
          _id: populatedMessage.sender._id,
          username: populatedMessage.sender.username,
          avatar: populatedMessage.sender.avatar || ""
        } : null,
        receiver: isAdminReceiver ? {
          _id: 'xyxyadminid',
          username: 'Admin Support'
        } : populatedMessage.receiver ? {
          _id: populatedMessage.receiver._id,
          username: populatedMessage.receiver.username
        } : null,
        receiverType: populatedMessage.receiverType,
        replyToMessageId: populatedMessage.replyToMessageId ? {
          _id: populatedMessage.replyToMessageId._id,
          content: populatedMessage.replyToMessageId.content,
          sender: {
            username: populatedMessage.replyToMessageId.sender.username
          }
        } : null,
        timestamp: populatedMessage.timestamp,
        status: populatedMessage.status
      }
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/v1/support/messages:", error);
    return NextResponse.json(
      { error: error.message || "Error sending message" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isAdmin = searchParams.get('admin') === 'true';
    const userId = isAdmin 
      ? process.env.ADMIN_ID 
      : (await getDataFromToken(request))?.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const messages = await SupportMessage.find({
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    })
    .sort({ timestamp: 1 })
    .populate('sender', 'username avatar')
    .lean();

    // Add isYour field based on sender
    const messagesWithIsYour = messages.map(message =>  ({
      ...message,
      isYour: isAdmin 
        ? message?.sender?.toString() === process.env.ADMIN_ID
        : message?.sender?.toString() === userId
    }));

    return NextResponse.json({
      status: "success",
      data: messagesWithIsYour
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await getDataFromToken(request);
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }

    const message = await SupportMessage.findById(messageId);

    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    // Only allow admin or message sender to delete
    if (message.sender.toString() !== userId && process.env.NEXT_PUBLIC_ADMIN_ID !== userId) {
      return NextResponse.json(
        { error: "Unauthorized to delete this message" },
        { status: 403 }
      );
    }

    message.isDeleted = true;
    await message.save();

    return NextResponse.json(
      { status: 'success', message: "Message deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting support message:", error);
    return NextResponse.json(
      { error: error.message || "Error deleting message" },
      { status: 500 }
    );
  }
}
