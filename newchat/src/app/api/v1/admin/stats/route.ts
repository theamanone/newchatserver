import { NextRequest, NextResponse } from "next/server";
import { getDataFromToken } from "@/app/(lib)/getDataFromToken";
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

    const userData = await getDataFromToken(request);

    if (!userData) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    // Get admin's application
    const admin = await AppAdmin.findOne({
      userId: userData.userId,
      isActive: true
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Admin not found or inactive" },
        { status: 404 }
      );
    }

    // Get statistics for the admin's application
    const [pendingMessages, activeChats, suspendedUsers] = await Promise.all([
      // Count pending messages
      SupportMessage.countDocuments({
        applicationId: admin.applicationId,
        receiverRole: 'admin',
        read: false
      }),
      
      // Count active chats (unique conversations in the last 24 hours)
      SupportMessage.distinct('sender', {
        applicationId: admin.applicationId,
        createdAt: { 
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) 
        }
      }),

      // Count suspended users
      SuspendedUser.countDocuments({
        applicationId: admin.applicationId,
        suspendedUntil: { $gt: new Date() }
      })
    ]);

    // Calculate total users (this is a placeholder - implement based on your user model)
    const totalUsers = (await SupportMessage.distinct('sender', {
      applicationId: admin.applicationId
    }))?.length;

    return NextResponse.json({
      totalUsers,
      activeChats: activeChats.length,
      pendingMessages,
      suspendedUsers
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
