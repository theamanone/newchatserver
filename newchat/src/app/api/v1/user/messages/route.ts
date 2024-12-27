import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/dbConfig/dbConfig";
import SupportMessage from "@/app/models/supportMessage.model";
import { getDataFromToken } from "@/app/(lib)/getDataFromToken";


export async function GET(request: NextRequest) {
  try {
    const userId = await getDataFromToken(request);
    await dbConnect();

    const messages = await SupportMessage.find({ 
      $or: [
        { 'sender._id': userId },
        { receiver: userId }
      ]
    })
    .sort({ timestamp: -1 })
    .limit(50);

    return NextResponse.json({
      messages,
      success: true
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getDataFromToken(request);
    const { content, messageType, replyTo } = await request.json();

    await dbConnect();

    // Create new message
    const newMessage = new SupportMessage({
      content,
      messageType,
      sender: {
        _id: userId,
        role: 'user'
      },
      receiver: 'admin', // Default receiver is admin
      timestamp: new Date(),
      status: 'sent',
      replyTo
    });

    await newMessage.save();

    return NextResponse.json({
      message: "Message sent successfully",
      success: true
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
