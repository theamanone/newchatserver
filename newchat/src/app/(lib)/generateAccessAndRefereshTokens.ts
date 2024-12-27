import { v4 as uuidv4 } from 'uuid'
import User from '@/app/models/user.model'
import jwt from 'jsonwebtoken'

interface TokenResponse {
  accessToken: string
  refreshToken: string
  deviceId: string
}

// Function to generate access and refresh tokens
export const generateAccessAndRefereshTokens = async (
  userId: string
): Promise<any> => {
  try {
    const user = await User.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Generate a new deviceId for each session
    const deviceId = uuidv4()

    // Generate access token
    // const accessToken = jwt.sign(
    //   {
    //     id: user._id,
    //     email: user.email,
    //     deviceId,
    //   },
    //   process.env.JWT_SECRET || 'your-secret-key',
    //   { expiresIn: '1d' }
    // );

    // // Generate refresh token
    // const refreshToken = jwt.sign(
    //   {
    //     id: user._id,
    //     deviceId,
    //   },
    //   process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key',
    //   { expiresIn: '7d' }
    // );

    // Save the refresh token for the user if needed
    // user.refreshToken = refreshToken;
    // await user.save({ validateBeforeSave: false });

    return { deviceId }
  } catch (error) {
    console.error('Error generating tokens:', error)
    throw new Error(
      'Something went wrong while generating refresh and access tokens'
    )
  }
}
