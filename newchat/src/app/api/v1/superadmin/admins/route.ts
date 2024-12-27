import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/dbConfig/dbConfig";
import { getDataFromToken } from "@/app/(lib)/getDataFromToken";
import AppAdmin from "@/app/models/appAdmin.model";
import Application from "@/app/models/application.model";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    // Verify superadmin status
    const {token} = await getDataFromToken(request);
    const isSuperAdmin = token && (token.role === "superadmin");

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Superadmin access required" },
        { status: 403 }
      );
    }

    const reqBody = await request.json();
    const { userId, applicationId } = reqBody;

    // Verify application exists
    const app = await Application.findById(applicationId);
    if (!app) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Check if admin already exists
    const existingAdmin = await AppAdmin.findOne({ userId, applicationId });
    if (existingAdmin) {
      return NextResponse.json(
        { error: "Admin already exists for this application" },
        { status: 400 }
      );
    }

    const newAdmin = await AppAdmin.create({
      userId,
      applicationId,
      role: "admin"
    });

    return NextResponse.json({
      message: "Admin added successfully",
      admin: newAdmin
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const {token} = await getDataFromToken(request);
    const isSuperAdmin = token && (token.role === "superadmin");

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Superadmin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("applicationId");

    const query = applicationId ? { applicationId } : {};
    const admins = await AppAdmin.find(query)
      .populate("applicationId")
      .sort({ createdAt: -1 });

    return NextResponse.json({ admins });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    const {token} = await getDataFromToken(request);
    const isSuperAdmin = token && (token.role === "superadmin");

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Superadmin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("id");

    if (!adminId) {
      return NextResponse.json(
        { error: "Admin ID is required" },
        { status: 400 }
      );
    }

    const admin = await AppAdmin.findById(adminId);
    if (!admin) {
      return NextResponse.json(
        { error: "Admin not found" },
        { status: 404 }
      );
    }

    // Prevent deletion of superadmin
    if (admin.role === "superadmin") {
      return NextResponse.json(
        { error: "Cannot delete superadmin" },
        { status: 403 }
      );
    }

    await admin.deleteOne();

    return NextResponse.json({
      message: "Admin removed successfully"
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
