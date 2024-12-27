import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectDB from '@/dbConfig/dbConfig';
import User from '@/app/models/user.model';

export async function DELETE(request: NextRequest) {
    try {
        // Get the user's token (this is for authentication)
        const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Connect to the database
        await connectDB();

        // Find the user by the token's user ID
        const user = await User.findById(token.sub);
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // Delete all QR codes associated with this user
        // await QRCode.deleteMany({ user: user._id });

        // Optionally, delete other user-related data (orders, profiles, etc.)
        // Example: await Order.deleteMany({ userId: user._id });

        // Delete the user account
        await User.deleteOne({ _id: user._id });

        return NextResponse.json({ message: 'User account and associated data deleted successfully', success: true }, { status: 200 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ message: 'Error processing DELETE request' }, { status: 500 });
    }
}
