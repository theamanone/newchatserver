import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import Message from '@/app/models/message.model'
import Group from '@/app/models/group.model'
import dbConnect from '@/dbConfig/dbConfig'
import { getDataFromToken } from '@/app/(lib)/getDataFromToken'
import { uploadFileToAPI } from '@/utils/fileStorage'

export async function POST(request: NextRequest) {
  await dbConnect()
  try {
    const { userId } = await getDataFromToken(request)
    const formData = await request.formData()

    const message = formData.get('message') as string
    const messageType = formData.get('messageType') as string
    const groupId = formData.get('groupId') as string
    const file = formData.get('file') as File | null

    // Validate required fields
    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    // Validate that at least one of message or file is present
    if (!message && !file) {
      return NextResponse.json(
        { error: 'Either message or file is required' },
        { status: 400 }
      )
    }

    // If no file is present, message is required
    if (!file && (!message || message.trim() === '')) {
      return NextResponse.json(
        { error: 'Message content is required when no file is attached' },
        { status: 400 }
      )
    }

    // Validate group membership
    const group = await Group.findById(groupId)
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const isMember =
      group.memberIds.includes(userId) || group.adminIds.includes(userId)
    if (!isMember) {
      return NextResponse.json(
        { error: 'User is not a member of this group' },
        { status: 403 }
      )
    }

    // Check if group allows messages
    if (!group.canSendMessages) {
      return NextResponse.json(
        { error: 'Group is currently not accepting messages' },
        { status: 403 }
      )
    }

    // Create new message
    const newMessage = new Message({
      sender: userId,
      groupId,
      content: message || '', // Use empty string if no message
      messageType: file ? (messageType || 'media') : (messageType || 'text'), // Default to 'media' if file present, 'text' if not
      isGroup: true
    })

    // Handle file upload if present
    if (file) {
      try {
        // Validate file size (e.g., 10MB limit)
        const maxSize = 10 * 1024 * 1024 // 10MB in bytes
        if (file.size > maxSize) {
          return NextResponse.json(
            { error: 'File size exceeds 10MB limit' },
            { status: 400 }
          )
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json(
            { error: 'Invalid file type. Allowed types: JPG, PNG, GIF, PDF' },
            { status: 400 }
          )
        }

        // Upload file directly
        const uploadResponse = await uploadFileToAPI(file)
        
        if (uploadResponse.success) {
          newMessage.mediaUrl = uploadResponse.data.secure_url
          newMessage.mediaPublicId = uploadResponse.data.public_id
          newMessage.fileType = uploadResponse.data.resource_type
          newMessage.mediaDetails = {
            url: uploadResponse.data.url,
            secure_url: uploadResponse.data.secure_url,
            public_id: uploadResponse.data.public_id,
            format: uploadResponse.data.format,
            resource_type: uploadResponse.data.resource_type
          }
        }
      } catch (error) {
        console.error('Error uploading file:', error)
        return NextResponse.json(
          { error: 'File upload failed' },
          { status: 500 }
        )
      }
    }

    await newMessage.save()

    // Populate sender information for the response
    await newMessage.populate('sender', 'username avatar')

    return NextResponse.json(
      {
        message: 'Message sent successfully',
        data: newMessage
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error in group message API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET (request: NextRequest) {
  try {
    const userId = await getDataFromToken(request)
    const searchParams = new URL(request.url).searchParams
    const groupId = searchParams.get('groupId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 50

    // Validate group membership
    const group = await Group.findById(groupId)
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const isMember =
      group.memberIds.includes(userId) || group.adminIds.includes(userId)
    if (!isMember) {
      return NextResponse.json(
        { error: 'User is not a member of this group' },
        { status: 403 }
      )
    }

    // Fetch messages with pagination
    const messages = await Message.find({
      groupId,
      isGroup: true,
      isDeleted: false,
      deletedBy: { $ne: userId }
    })
      .populate('sender', 'username avatar')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    return NextResponse.json({ messages }, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching group messages:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE (request: NextRequest) {
  try {
    const userId = await getDataFromToken(request)
    const searchParams = new URL(request.url).searchParams
    const messageId = searchParams.get('messageId')
    const groupId = searchParams.get('groupId')

    // Find the message
    const message = await Message.findById(messageId)
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Verify it's a group message
    if (!message.isGroup || message.groupId.toString() !== groupId) {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
    }

    // Check if user has permission to delete
    const group = await Group.findById(groupId)
    const isAdmin = group?.adminIds.includes(userId)
    const isSender = message.sender.toString() === userId

    if (!isAdmin && !isSender) {
      return NextResponse.json(
        { error: 'Not authorized to delete this message' },
        { status: 403 }
      )
    }

    // Soft delete for the user
    if (!message.deletedBy.includes(userId)) {
      message.deletedBy.push(userId)
      await message.save()
    }

    return NextResponse.json(
      { message: 'Message deleted successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error deleting group message:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
