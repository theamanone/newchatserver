import { NextRequest, NextResponse } from "next/server";
import { getDataFromToken } from "@/app/(lib)/getDataFromToken";
import dbConnect from '@/dbConfig/dbConfig';
import appAdminModel from "@/app/models/appAdmin.model";

const AppAdmin = appAdminModel;

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

    // Get admin data
    const admin = await AppAdmin.findOne({
      // userId: userData.userId,
      userId: 'windsurf99999999999',
      isActive: true
    }).populate('applicationId');

    if (!admin) {
      return NextResponse.json(
        { error: "Admin not found or inactive" },
        { status: 404 }
      );
    }

    if (admin.role !== 'admin') {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      applicationId: admin.applicationId,
      role: admin.role,
      isActive: admin.isActive,
      userId: admin.userId
    });
  } catch (error: any) {
    console.error('Admin verify error:', error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
