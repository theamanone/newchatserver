import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/dbConfig/dbConfig";
import AppAdmin from "@/app/models/appAdmin.model";
import SupportMessage from "@/app/models/supportMessage.model";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Get admin ID from header
    const adminId = request.headers.get('admin-id');
    if (!adminId) {
      return NextResponse.json(
        { error: "Admin ID required" },
        { status: 401 }
      );
    }

    // Get admin's application
    const admin = await AppAdmin.findOne({
      userId: adminId,
      isActive: true
    }).populate('applicationId');

    if (!admin) {
      return NextResponse.json(
        { error: "Admin not found or inactive" },
        { status: 404 }
      );
    }

    // Get messages for this application
    const messages = await SupportMessage.find({
      applicationId: admin.applicationId
    })
    .sort({ timestamp: -1 })
    .limit(100) // Limit to last 100 messages
    .populate('sender', 'name')
    .lean();

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error('Admin messages error:', error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
