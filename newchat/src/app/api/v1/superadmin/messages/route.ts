import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/dbConfig/dbConfig";
import { getDataFromToken } from "@/app/(lib)/getDataFromToken";
import SupportMessage from "@/app/models/supportMessage.model";
import Application from "@/app/models/application.model";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { token } = await getDataFromToken(request);
    const isSuperAdmin = token && token.role === "superadmin";

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Superadmin access required" },
        { status: 403 }
      );
    }

    // Get all applications first
    const applications = await Application.find().lean();
    const appNameMap = applications.reduce((acc, app) => {
      acc[app._id.toString()] = app.name;
      return acc;
    }, {} as Record<string, string>);

    // Get messages across all applications
    const messages = await SupportMessage.find()
      .sort({ timestamp: -1 })
      .limit(100) // Limit to last 100 messages
      .populate('sender', 'name')
      .lean();

    // Add application names to messages
    const messagesWithAppNames = messages.map(message => ({
      ...message,
      applicationName: appNameMap[message.applicationId.toString()] || 'Unknown Application'
    }));

    return NextResponse.json({ messages: messagesWithAppNames });
  } catch (error: any) {
    console.error('Superadmin messages error:', error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
