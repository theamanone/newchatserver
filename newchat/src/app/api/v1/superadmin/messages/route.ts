import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/dbConfig/dbConfig";
import SupportMessage from "@/app/models/supportMessage.model";
import SuspendedUser from "@/app/models/suspendedUser.model";
import Application from "@/app/models/application.model";

const MESSAGES_PER_PAGE = 20;
const DEFAULT_PROFILE_PICTURE = '';

interface UserData {
  id: string;
  role: 'user' | 'admin' | 'superadmin';
  applicationId?: string;
}

async function getUserData(req: NextRequest): Promise<UserData | null> {
  // For web admin/superadmin access
  const adminId = req.headers.get('admin-id');
  const adminRole = req.headers.get('admin-role');
  // console.log("admin id : ", adminId, " role : ", adminRole)
  if (adminId && adminRole && (adminRole === 'admin' || adminRole === 'superadmin')) {
    return {
      id: adminId,
      role: adminRole as 'admin' | 'superadmin',
      applicationId: req.headers.get('admin-application-id') || undefined
    };
  }

  // For mobile app access
  const userId = req.headers.get('x-user-id');
  const userRole = req.headers.get('x-user-role');
  const appId = req.headers.get('x-application-id');

  if (userRole === 'user') {
    if (!userId || !appId) {
      return null;
    }
    return {
      id: userId,
      role: 'user',
      applicationId: appId
    };
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const userData = await getUserData(request);
    if (!userData) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized access. Missing or invalid credentials." }),
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');
    const cursor = searchParams.get('cursor'); // For pagination
    const direction = searchParams.get('direction') || 'newer'; // 'older' or 'newer'

    // Build query based on cursor and direction
    let query: any = { isDeleted: false };

    // Only filter by applicationId if specified
    if (applicationId) {
      query.applicationId = applicationId;
    }

    if (cursor) {
      query._id = direction === 'older'
        ? { $lt: cursor }
        : { $gt: cursor };
    }

    // Get messages with pagination
    const messages = await SupportMessage.find(query)
      .sort({ _id: direction === 'older' ? -1 : 1 })
      .limit(MESSAGES_PER_PAGE + 1) // Get one extra to check if there are more
      .populate('applicationId', 'name')
      .populate('sender', 'name role profilePicture')
      .lean();

    // Check if there are more messages
    const hasMore = messages.length > MESSAGES_PER_PAGE;
    if (hasMore) {
      messages.pop(); // Remove the extra message
    }

    // Format messages
    const formattedMessages = messages.map(message => ({
      ...message,
      applicationName: message.applicationId?.name || 'Unknown Application',
      applicationId: message.applicationId?._id,
      sender: {
        ...message.sender,
        profilePicture: message.sender?.profilePicture || DEFAULT_PROFILE_PICTURE
      }
    }));

    // If direction is newer, reverse the array to maintain chronological order
    if (direction === 'newer') {
      formattedMessages.reverse();
    }

    return new NextResponse(
      JSON.stringify({
        messages: formattedMessages,
        hasMore,
        nextCursor: hasMore ? messages[messages.length - 1]._id : null
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in GET /api/v1/superadmin/messages:', error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = await getUserData(request);
    if (!userData) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized access. Missing or invalid credentials." }),
        { status: 401 }
      );
    }

    await dbConnect();

    let content, file, receiverId;

    // Handle both form data and JSON requests
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      content = formData.get('content') as string;
      file = formData.get('file') as File;
      receiverId = formData.get('receiverId') as string;
    } else {
      const body = await request.json();
      content = body.content;
      receiverId = body.receiverId;
    }

    if (!content && !file) {
      return new NextResponse(
        JSON.stringify({ error: "Message content or file is required" }),
        { status: 400 }
      );
    }
    console.log("userdata : ", userData)
    // Check if user is suspended (only for user role)
    if (userData.role === 'user') {
      const isSuspended = await SuspendedUser.findOne({
        userId: userData.id,
        applicationId: userData.applicationId,
        $or: [
          { suspendedUntil: { $gt: new Date() } },
          { suspendedUntil: null } // Permanent suspension
        ]
      });

      if (isSuspended) {
        return new NextResponse(
          JSON.stringify({ error: "You don't have permission to send messages as you are currently suspended" }),
          { status: 403 }
        );
      }
    }

    const messageData: any = {
      sender: userData.id,
      senderRole: userData.role,
      content: content || '',
      messageType: file ? (file.type.startsWith('image/') ? 'file' : 'file') : 'text',
      applicationId: userData.applicationId,
      timestamp: new Date(),
      isDeleted: false
    };

    if (receiverId) {
      messageData.receiver = receiverId;
      messageData.receiverRole = userData.role === 'user' ? 'admin' : 'user';
    }

    if (file) {
      // Handle file upload here
      messageData.fileType = file.type;
      messageData.mediaUrl = ''; // Set the uploaded file URL
    }

    const message = await SupportMessage.create(messageData);
    const populatedMessage = await message
      .populate('applicationId', 'name')
      .execPopulate();

    return new NextResponse(
      JSON.stringify({
        message: {
          ...populatedMessage.toObject(),
          applicationName: populatedMessage.applicationId?.name || 'Unknown Application',
          // Handle media if present
          mediaUrl: populatedMessage.messageType !== 'text' ? populatedMessage.mediaUrl : undefined,
          fileUrl: populatedMessage.messageType === 'file' ? populatedMessage.fileUrl : undefined
        }
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Create message error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to create message" }),
      { status: 500 }
    );
  }
}
