import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/dbConfig/dbConfig'
import User from '@/app/models/user.model'
import { getDataFromToken } from '@/app/(lib)/getDataFromToken'

export async function GET (request: NextRequest) {
  await dbConnect()
  try {
    // Extract user ID from the token
    const { userId } = await getDataFromToken(request)

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Find the user in the database
    const user = await User.findById(userId).select('-password') // Exclude password for security

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Respond with user data
    return NextResponse.json(
      {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          lastSeen: user.lastSeen,
          isActive: user.isActive,
          isSuspended: user.isSuspended,
          groups: user.chatGroups // Array of group IDs already stored in user model
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching user data:', error)
    return NextResponse.json(
      { message: 'Error fetching user data' },
      { status: 500 }
    )
  }
}
