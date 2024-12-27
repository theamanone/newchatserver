import Message from "@/app/models/message.model"; // Adjust the import according to your file structure
import { getDataFromToken } from "@/app/(lib)/getDataFromToken";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest, { params }: { params: { messageId: string } }) {
  try {
    const { messageId } = params;

    const searchParams = request.nextUrl.searchParams;
    const deleteForEveryone: boolean = searchParams.get("deleteForEveryone")  === 'true';


    const {userId} = await getDataFromToken(request);
    
    if (!messageId || !userId) {
      return NextResponse.json(
        { message: "Message ID and User ID are required." },
        { status: 400 }
      );
    }

    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json(
        { message: "Message not found." },
        { status: 404 }
      );
    }

    // If deleteForEveryone is true, mark the message as deleted for everyone
    if (deleteForEveryone) {
      message.isDeleted = true;
    } else {
      // If not deleting for everyone, add the user to the deletedBy array
      if (!message.deletedBy?.includes(userId)) {
        message.deletedBy?.push(userId);
      }
    }

    await message.save(); // Save the changes

    return NextResponse.json(
      { message: deleteForEveryone ? "Message deleted for everyone." : "Message deleted for you." },
      { status: 200 }
    );
  } catch (error:any) {
    console.error("Error deleting message:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}