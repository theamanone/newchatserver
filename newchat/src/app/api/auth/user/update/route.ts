import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectDB from '@/dbConfig/dbConfig';
import User from '@/app/models/user.model';

export async function PATCH(request: NextRequest) {
  try {
    // Get the user's token (this is for authentication)
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Parse the body to get the updated user data
    const { name, email } = await request.json();

    // Connect to the database
    await connectDB();

    // Find the user by the token's user ID
    const user = await User.findById(token.sub);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Prevent updating the email for now
    if (email) {
      return NextResponse.json({ message: "Email update is not allowed at this time" }, { status: 400 });
    }

    // Ensure the name is provided and valid
    if (name && typeof name === 'string' && name.trim() !== '') {
      // Update the user's name
      user.name = name.trim();
      await user.save();
      return NextResponse.json({ message: "User details updated successfully", user: user }, { status: 200 });
    } else {
      return NextResponse.json({ message: "Name is required and must be a valid string" }, { status: 400 });
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ message: 'Error processing PATCH request' }, { status: 500 });
  }
}
