import dbConnect from '@/dbConfig/dbConfig'
import Group from '@/app/models/group.model'
import User from '@/app/models/user.model'
import { NextRequest, NextResponse } from 'next/server'
import { getDataFromToken } from '@/app/(lib)/getDataFromToken'
import Message from '@/app/models/message.model'
import Conversation from '@/app/models/conversation.model'
import mongoose from 'mongoose'

export async function GET(
  request: NextRequest,
  { params }: { params: { convid: string } }
) {
  await dbConnect()
  try {
    const tokenData = await getDataFromToken(request)
    
    // Check if token data is valid and contains userId
    if (!tokenData || !tokenData.userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = tokenData.userId
    const { convid } = params
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')

    console.log('userId from token:', userId)
    console.log('convid:', convid)

    if (!type || (type !== 'c' && type !== 'gc')) {
      return NextResponse.json(
        { message: 'Invalid conversation type' },
        { status: 400 }
      )
    }

    let conversation
    let response

    // Handle individual chat conversation (type 'c')
    if (type === 'c') {
      // Find conversation directly by ID
      conversation = await Conversation.findById(convid)
        .populate({
          path: 'participants',
          model: User,
          select: '_id username email avatar'
        })
        .populate({
          path: 'latestMessage',
          model: Message,
          populate: { path: 'sender receiver' }
        })

      if (!conversation) {
        return NextResponse.json(
          { message: 'Conversation not found' },
          { status: 404 }
        )
      }

      // Check if current user is a participant
      if (!conversation.participants.some((p: any) => p._id.toString() === userId)) {
        return NextResponse.json(
          { message: 'Unauthorized: Not a participant of this conversation' },
          { status: 403 }
        )
      }

      // Find the other participant
      const otherUser = conversation.participants.find(
        (p: any) => p._id.toString() !== userId.toString()
      )

      if (!otherUser) {
        return NextResponse.json(
          { message: 'Invalid conversation: No other participant found' },
          { status: 400 }
        )
      }

      response = {
        type: 'c',
        conversation_id: conversation._id,
        otherUser: {
          _id: otherUser._id,
          username: otherUser.username,
          avatar: otherUser.avatar,
          email: otherUser.email
        },
        latestMessage: conversation.latestMessage
      }
    }
    // Handle group chat conversation (type 'gc')
    else if (type === 'gc') {
      // Find group by ID and check if user is either in memberIds or adminIds
      const group = await Group.findById(convid)
        .populate('memberIds adminIds', '_id username email avatar')

      if (!group) {
        return NextResponse.json(
          { message: 'Group not found' },
          { status: 404 }
        )
      }

      // Check if user is a member or admin
      const isAdmin = group.adminIds.some((id: any) => id._id.toString() === userId)
      const isMember = group.memberIds.some((id: any) => id._id.toString() === userId)

      if (!isAdmin && !isMember) {
        return NextResponse.json(
          { message: 'Unauthorized: Not a member of this group' },
          { status: 403 }
        )
      }

      // Check if group is deleted
      if (group.isDeleted) {
        return NextResponse.json(
          { message: 'Group has been deleted' },
          { status: 404 }
        )
      }

      // Combine and deduplicate members and admins
      const allMembers = [
        ...(group.memberIds || []),
        ...(group.adminIds || [])
      ].filter((member, index, self) => 
        index === self.findIndex((m) => m._id.toString() === member._id.toString())
      )

      response = {
        type: 'gc',
        group_id: group._id,
        group: {
          _id: group._id,
          name: group.name,
          members: allMembers,
          groupPicUrl: group.groupPicUrl,
          canSendMessages: group.canSendMessages,
          adminIds: group.adminIds,
          isAdmin,
          isMember
        }
      }
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error in conversation route:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
