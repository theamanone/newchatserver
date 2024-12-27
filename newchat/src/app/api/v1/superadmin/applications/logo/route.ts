import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/dbConfig/dbConfig";
import { getDataFromToken } from "@/app/(lib)/getDataFromToken";
import Application from "@/app/models/application.model";
import AppAdmin from "@/app/models/appAdmin.model";
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const {token} = await getDataFromToken(request);
    
    // Verify superadmin status
    const isSuperAdmin = await AppAdmin.findOne({
      userId: token.id,
      role: "superadmin"
    });

    // if (!isSuperAdmin) {
    //   return NextResponse.json(
    //     { error: "Unauthorized: Superadmin access required" },
    //     { status: 403 }
    //   );
    // }

    const formData = await request.formData();
    const file = formData.get('logo') as File;
    const appId = formData.get('appId') as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Find the application
    const application = await Application.findById(appId);
    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Delete old logo if exists
    if (application.logo?.publicId) {
      await cloudinary.uploader.destroy(application.logo.publicId);
    }

    // Convert File to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'app-logos',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      // Convert buffer to stream and pipe to cloudinary
      const bufferStream = require('stream').Readable.from(buffer);
      bufferStream.pipe(uploadStream);
    });

    // Update application with new logo
    application.logo = {
      url: (result as any).secure_url,
      publicId: (result as any).public_id,
    };
    await application.save();

    return NextResponse.json({
      message: "Logo uploaded successfully",
      logo: application.logo,
    });
  } catch (error: any) {
    console.error('Error uploading logo:', error);
    return NextResponse.json(
      { error: "Failed to upload logo" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    const {token} = await getDataFromToken(request);
    
    // Verify superadmin status
    const isSuperAdmin = await AppAdmin.findOne({
      userId: token.id,
      role: "superadmin"
    });

    // if (!isSuperAdmin) {
    //   return NextResponse.json(
    //     { error: "Unauthorized: Superadmin access required" },
    //     { status: 403 }
    //   );
    // }

    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');

    if (!appId) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      );
    }

    // Find the application
    const application = await Application.findById(appId);
    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Delete logo from Cloudinary if exists
    if (application.logo?.publicId) {
      await cloudinary.uploader.destroy(application.logo.publicId);
    }

    // Remove logo from application
    application.logo = undefined;
    await application.save();

    return NextResponse.json({
      message: "Logo removed successfully"
    });
  } catch (error: any) {
    console.error('Error removing logo:', error);
    return NextResponse.json(
      { error: "Failed to remove logo" },
      { status: 500 }
    );
  }
}
