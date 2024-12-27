import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/dbConfig/dbConfig";
import appAdminModel from "@/app/models/appAdmin.model";
import supportMessageModel from "@/app/models/supportMessage.model";
import suspendedUserModel from "@/app/models/suspendedUser.model";

const AppAdmin = appAdminModel;
const SupportMessage = supportMessageModel;
const SuspendedUser = suspendedUserModel;

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Get admin ID from header (for both web and mobile)
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
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Admin not found or inactive" },
        { status: 404 }
      );
    }

    // Get all users who have sent messages in this application
    const userMessages = await SupportMessage.aggregate([
      {
        $match: {
          applicationId: admin.applicationId,
          senderRole: 'user'
        }
      },
      {
        $group: {
          _id: '$sender',
          lastActive: { $max: '$createdAt' },
          messageCount: { $sum: 1 },
          name: { $first: '$senderName' }
        }
      }
    ]);

    // Get suspended users
    const suspendedUsers = await SuspendedUser.find({
      applicationId: admin.applicationId,
      suspendedUntil: { $gt: new Date() }
    }).select('userId');

    const suspendedUserIds = new Set(suspendedUsers.map(u => u.userId));

    const users = userMessages.map(user => ({
      userId: user._id,
      name: user.name || 'Unknown User',
      lastActive: user.lastActive,
      status: suspendedUserIds.has(user._id) ? 'suspended' : 'active',
      messageCount: user.messageCount
    }));

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Admin users error:', error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
