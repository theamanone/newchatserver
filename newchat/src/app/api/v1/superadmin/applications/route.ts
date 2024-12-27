import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/dbConfig/dbConfig";
import { getDataFromToken } from "@/app/(lib)/getDataFromToken";
import Application from "@/app/models/application.model";
import AppAdmin from "@/app/models/appAdmin.model";

export async function POST(request: NextRequest) {
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

    const reqBody = await request.json();
    const { name, settings } = reqBody;

    const existingApp = await Application.findOne({ name });
    if (existingApp) {
      return NextResponse.json(
        { error: "Application with this name already exists" },
        { status: 400 }
      );
    }

    const newApp = await Application.create({
      name,
      settings: settings || {},
    });

    return NextResponse.json({
      message: "Application created successfully",
      app: newApp,
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

    const applications = await Application.find({}).sort({ createdAt: -1 });
    const appIds = applications.map(app => app._id);
    
    // Get admin counts for each application
    const adminCounts = await AppAdmin.aggregate([
      { $match: { applicationId: { $in: appIds } } },
      { $group: { _id: "$applicationId", count: { $sum: 1 } } }
    ]);

    const appsWithAdminCount = applications.map(app => ({
      ...app.toObject(),
      adminCount: adminCounts.find(count => count._id.equals(app._id))?.count || 0
    }));

    return NextResponse.json({ applications: appsWithAdminCount , count: applications?.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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

    const reqBody = await request.json();
    const { appId, settings, isActive } = reqBody;

    const app = await Application.findById(appId);
    if (!app) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (settings) app.settings = settings;
    if (typeof isActive === 'boolean') app.isActive = isActive;

    await app.save();

    return NextResponse.json({
      message: "Application updated successfully",
      app
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


// delete application 
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
    const appId = searchParams.get("appId");

    const app = await Application.findById(appId);
    if (!app) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    await app.deleteOne();

    return NextResponse.json({
      message: "Application removed successfully"
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}