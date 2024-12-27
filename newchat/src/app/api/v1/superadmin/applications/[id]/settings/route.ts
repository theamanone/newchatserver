import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/dbConfig/dbConfig";
import Application from "@/app/models/application.model";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const application = await Application.findById(params.id);
    if (!application) {
      return new NextResponse(
        JSON.stringify({ error: "Application not found" }),
        { status: 404 }
      );
    }

    return new NextResponse(
      JSON.stringify({ settings: application.settings || {} }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Get settings error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch settings" }),
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const application = await Application.findById(params.id);
    if (!application) {
      return new NextResponse(
        JSON.stringify({ error: "Application not found" }),
        { status: 404 }
      );
    }

    const body = await request.json();
    const settings = {
      ...application.settings || {},
      ...body,
      welcomeMessage: body.welcomeMessage || `Welcome to ${application.name}! How can we help you today?`,
      maxMessageLength: body.maxMessageLength || 1000,
      allowFileUploads: body.allowFileUploads ?? true,
      allowedFileTypes: body.allowedFileTypes || ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
      maxFileSize: body.maxFileSize || 5
    };

    // Validate email if provided
    if (settings.supportEmail && !/\S+@\S+\.\S+/.test(settings.supportEmail)) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400 }
      );
    }

    application.settings = settings;
    await application.save();

    return new NextResponse(
      JSON.stringify({ settings: application.settings }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Update settings error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to update settings" }),
      { status: 500 }
    );
  }
}
