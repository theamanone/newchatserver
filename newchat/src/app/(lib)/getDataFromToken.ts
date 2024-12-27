import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export const getDataFromToken = async (request: NextRequest): Promise<any> => {
  try {
    // Retrieve the token using NextAuth's `getToken` function
    const token:any = await getToken({
      req: request, 
      secret: process.env.NEXTAUTH_SECRET // Ensure your NextAuth secret is set in the environment
    });

    if (!token) {
      throw new Error("Token not found or invalid");
    }

    // Extract the desired data from the token
    const userId = token.id; // Assuming `id` is stored in the token
    const deviceId = token.deviceId; // Assuming `deviceId` is stored in the token

    if (!userId) {
      throw new Error("User ID is missing in token");
    }

    return { userId, deviceId, token };  
  } catch (error: any) {
    console.warn("Token verification failed:", error.message);
    return { error: "Invalid token", status: 401 };
  }
};
