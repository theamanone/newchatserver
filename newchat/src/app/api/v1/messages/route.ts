import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/dbConfig/dbConfig";
import SupportMessage from "@/app/models/supportMessage.model";

// Helper function to validate role
const validateRole = (role: string) => {
  return ['admin', 'superadmin', 'user'].includes(role);
};

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Get role and userId from headers
    const role = request.headers.get('role');
    const userId = request.headers.get('user-id');

    // console.log(" role : ", role, " userId : ", userId);

    if (!role || !validateRole(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    let query = {};
    const searchParams = request.nextUrl.searchParams;
    const searchQuery = searchParams.get('query');
    const applicationId = searchParams.get('applicationId');

    // console.log("searchQuery : ", searchQuery, " applicationId : ", applicationId);
    
    // Build query based on role and search parameters
    if (role === 'superadmin') {
      query = {
        ...(searchQuery && {
          $or: [
            { content: { $regex: searchQuery, $options: 'i' } },
            { 'sender.name': { $regex: searchQuery, $options: 'i' } }
          ]
        }),
        ...(applicationId && { applicationId }),
        isDeleted: { $ne: true }
      };
    } else if (role === 'admin') {
      query = {
        $or: [
          { senderRole: 'user' },
          { receiver: userId }
        ],
        ...(searchQuery && {
          content: { $regex: searchQuery, $options: 'i' }
        }),
        isDeleted: { $ne: true }
      };
    } else { // user
      query = {
        $or: [
          { sender: userId },
          { receiver: userId }
        ],
        applicationId,
        isDeleted: { $ne: true }
      };
    }

    // console.log("Final query:", JSON.stringify(query, null, 2));

    const messages = await SupportMessage.find(query)
      .sort({ timestamp: -1 })
      .limit(50);

    // console.log("Found messages count:", messages.length);

    return NextResponse.json({
      messages,
      success: true
    });
  } catch (error: any) {
    console.error("Error in GET messages:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { content, messageType, applicationId } = await request.json();

    // Get role and userId from headers
    const role = request.headers.get('role');
    const userId = request.headers.get('user-id');
    const userName = request.headers.get('user-name');

    // console.log("Message data:", {
    //   content,
    //   messageType,
    //   applicationId,
    //   role,
    //   userId,
    //   userName
    // });

    if (!role || !validateRole(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    await dbConnect();

    // Create new message
    const newMessage = new SupportMessage({
      content,
      messageType: messageType || 'text',
      sender: userId,
      senderRole: role,
      receiver: role === 'user' ? 'admin' : 'user',
      timestamp: new Date(),
      status: 'sent',
      applicationId,
      isDeleted: false
    });

    const savedMessage = await newMessage.save();
    // console.log("Saved message:", savedMessage);

    return NextResponse.json({
      message: "Message sent successfully",
      success: true,
      data: savedMessage
    });
  } catch (error: any) {
    console.error("Error in POST message:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { messageId } = await request.json();
    const role = request.headers.get('role');

    if (role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    
    // Soft delete
    await SupportMessage.findByIdAndUpdate(messageId, {
      isDeleted: true
    });

    return NextResponse.json({
      message: "Message deleted successfully",
      success: true
    });
  } catch (error: any) {
    console.error("Error in DELETE message:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
