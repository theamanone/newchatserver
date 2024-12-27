'use server';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { Message, MessageReply } from '@/models/Message';

export async function POST(
  req: Request,
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId } = params;
    const { content } = await req.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Get the original message
    const message = await Message.findById(messageId).populate('application');
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user has permission to reply
    if (
      session.user.role !== 'superadmin' &&
      (session.user.role !== 'admin' || message.application.adminId !== session.user.id)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create the reply
    const reply = new MessageReply({
      content,
      messageId,
      senderId: session.user.id,
      senderName: session.user.name,
      senderRole: session.user.role,
      timestamp: new Date(),
    });

    await reply.save();

    // Update the message status
    message.status = 'REPLIED';
    message.isReplied = true;
    await message.save();

    // Return the formatted reply
    return NextResponse.json({
      reply: {
        _id: reply._id,
        content: reply.content,
        sender: {
          _id: session.user.id,
          name: session.user.name,
          role: session.user.role.toLowerCase(),
        },
        timestamp: reply.timestamp,
      },
    });
  } catch (error) {
    console.error('Error in reply API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
