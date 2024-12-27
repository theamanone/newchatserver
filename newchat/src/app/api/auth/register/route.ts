// src/app/api/v1/route.ts
import dbConnect from '@/dbConfig/dbConfig'
import User from '@/app/models/user.model'
import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/app/(lib)/mailer'

dbConnect()

// Function to generate a unique username
async function generateUniqueUsername (email: string): Promise<string> {
  // Get the part before @ in email
  const baseUsername = email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove special characters
    .slice(0, 20) // Limit length

  // Try the base username first
  const exists = await User.findOne({ username: baseUsername })
  if (!exists) {
    return baseUsername
  }

  // If base username exists, add random numbers until we find a unique one
  let username
  let attempts = 0
  do {
    // Generate a random 4-digit number
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    username = `${baseUsername}${randomSuffix}`
    const exists = await User.findOne({ username })
    attempts++

    // Prevent infinite loop
    if (attempts > 10) {
      // If we can't find a unique username after 10 attempts, use timestamp
      username = `${baseUsername}${Date.now().toString().slice(-4)}`
      break
    }
  } while (exists)

  return username
}

export async function POST (request: NextRequest) {
  try {
    const reqBody = await request.json()
    const { email, password } = reqBody

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required.' },
        { status: 400 }
      )
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already exists.' },
        { status: 409 }
      )
    }

    // Generate a unique username
    const username = await generateUniqueUsername(email)

    // Create a new user with the generated username
    const newUser = new User({
      email,
      password,
      username,
      isActive: true,
      isSuspended: false,
      lastSeen: new Date(),
      blockedUsers: [],
      sessions: [],
      chatGroups: []
    })

    // Save the user first to get the _id
    await newUser.save()

    try {
      // Send verification email
      await sendEmail({
        email,
        emailType: 'VERIFY',
        userId: newUser._id.toString()
      })

      return NextResponse.json(
        {
          message: 'User registered successfully. Please check your email for verification.',
          username
        },
        { status: 201 }
      )
    } catch (emailError) {
      // If email sending fails, still create the account but inform the user
      console.error('Failed to send verification email:', emailError)
      return NextResponse.json(
        {
          message: 'Account created but verification email could not be sent. Please contact support.',
          username
        },
        { status: 201 }
      )
    }
  } catch (error) {
    console.error('Error in registration route:', error)
    return NextResponse.json(
      { message: 'Internal server error.' },
      { status: 500 }
    )
  }
}
