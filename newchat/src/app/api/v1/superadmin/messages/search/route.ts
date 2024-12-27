import { NextRequest, NextResponse } from "next/server";

import SupportMessage from "@/app/models/supportMessage.model";
import SuspendedUser from "@/app/models/suspendedUser.model";
import dbConnect from "@/dbConfig/dbConfig";
import { DEFAULT_PROFILE_PICTURE } from "@/lib/data";

const MESSAGES_PER_PAGE = 20;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const applicationId = searchParams.get('applicationId');
    const page = parseInt(searchParams.get('page') || '1');

    if (!query) {
      return new NextResponse(
        JSON.stringify({ error: "Search query is required" }),
        { status: 400 }
      );
    }

    await dbConnect();

    // Build search query
    const searchQuery: any = {
      isDeleted: false,
      $or: [
        { content: { $regex: query, $options: 'i' } },
        { 'sender.name': { $regex: query, $options: 'i' } }
      ]
    };

    if (applicationId && applicationId !== 'all') {
      searchQuery.applicationId = applicationId;
    }

    const messages = await SupportMessage.find(searchQuery)
      .sort({ timestamp: -1 })
      .skip((page - 1) * MESSAGES_PER_PAGE)
      .limit(MESSAGES_PER_PAGE)
      .populate('applicationId', 'name')
      .populate('sender', 'name role profilePicture')
      .lean();

    const total = await SupportMessage.countDocuments(searchQuery);

    return new NextResponse(
      JSON.stringify({
        messages: messages.map(message => ({
          ...message,
          applicationName: message.applicationId?.name || 'Unknown Application',
          sender: {
            ...message.sender,
            profilePicture: message.sender?.profilePicture || DEFAULT_PROFILE_PICTURE
          }
        })),
        total,
        hasMore: total > page * MESSAGES_PER_PAGE
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/v1/superadmin/messages/search:', error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}
