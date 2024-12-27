import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/dbConfig/dbConfig";
import { getDataFromToken } from "@/app/(lib)/getDataFromToken";
import SupportMessage from "@/app/models/supportMessage.model";
import Application from "@/app/models/application.model";
import AppAdmin from "@/app/models/appAdmin.model";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const { token } = await getDataFromToken(request);
    const isSuperAdmin = token && token.role === "superadmin";

    // Get the application
    const application = await Application.findById(params.id);
    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Check permissions
    if (!isSuperAdmin) {
      // For admin users, check if they have access to this application
      const admin = await AppAdmin.findOne({
        userId: token.id,
        applicationId: params.id,
        isActive: true
      });

      if (!admin) {
        return NextResponse.json(
          { error: "Unauthorized: No access to this application" },
          { status: 403 }
        );
      }
    }

    // Get messages for this application
    const messages = await SupportMessage.find({
      applicationId: params.id
    })
      .sort({ timestamp: -1 })
      .limit(100)
      .populate('sender', 'name')
      .populate({
        path: 'replies',
        populate: {
          path: 'sender',
          select: 'name role'
        }
      })
      .lean();

    const messagesWithAppName = messages.map(message => ({
      ...message,
      applicationName: application.name
    }));

    return NextResponse.json({ messages: messagesWithAppName });
  } catch (error: any) {
    console.error('Application messages error:', error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
