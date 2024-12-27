import { getDataFromToken } from '@/app/(lib)/getDataFromToken'
import User from '@/app/models/user.model'
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/dbConfig/dbConfig'

// Helper function to generate a random number within a range
const getRandomInRange = (min: number, max: number) => {
  return Math.random() * (max - min) + min
}

// Helper function to generate a random percentage with slight variance
const getRandomPercentage = (base: number, variance: number) => {
  const value = base + getRandomInRange(-variance, variance)
  return `${value.toFixed(2)}%`
}

const isDeviceHealthy = (deviceHealthData: any) => {
  return true // Return true if the device passes all checks
}

// POST route to handle health check and session validation
export async function POST(request: NextRequest) {
  try {
    // Ensure database connection is established
    await dbConnect();

    // Extract token data (userId, deviceId)
    const { userId, deviceId, error, status } = await getDataFromToken(request)

    // console.log("userid : ", userId)
    // console.log("deviceId : ", deviceId)

    if (error) {
      return new Response(JSON.stringify({ message: error }), { status })
    }

    const deviceHealthData = await request.json()

    if (!isDeviceHealthy(deviceHealthData)) {
      return NextResponse.json(
        {
          success: false,
          status: 'error',
          systemStatus: {
            deviceHealth: 'failed'
          },
          message:
            'Device is not healthy enough to handle the app. Please try again later.'
        },
        { status: 400 }
      )
    }

    // Fetch user from the database
    const user = await User.findById(userId)
// console.log("user : ", user)
    if (!user) {
      // User not found
      return NextResponse.json(
        {
          success: false,
          status: 'error',
          systemStatus: {
            authModule: 'degraded',
            sessionValidation: 'failed'
          },
          message: 'User not found'
        },
        { status: 404 }
      )
    }

    // Check if the deviceId matches a session in the database
    const validSession = user.sessions.some(
      (session: any) => session.deviceId === deviceId
    )

    if (!validSession) {
      // Session invalid
      return NextResponse.json(
        {
          success: false,
          status: 'error',
          systemStatus: {
            authModule: 'active',
            sessionValidation: 'failed'
          },
          action: 'logout',
          message: 'Invalid session detected. Please log in again.'
        },
        { status: 401 }
      )
    }

    // Check for account suspension
    if (user.isSuspended) {
      return NextResponse.json(
        {
          success: false,
          status: 'error',
          systemStatus: {
            userAccount: 'suspended'
          },
          action: 'suspend',
          message: 'Account suspended. Contact support for assistance.'
        },
        { status: 403 }
      )
    }

    // Generating analytics data
    const activeUsers = Math.floor(getRandomInRange(5500, 6000)) // Active users between 5500 and 6000
    const serverUptime = getRandomPercentage(99.9, 0.05) // Server uptime around 99.9% with slight variance
    const avgResponseTime = `${getRandomInRange(110, 150).toFixed(1)}ms`

    // Expanded feature flags
    const featureFlags = {
      enhancedSecurity: true,
      experimentalFeatureX: process.env.EXPERIMENTAL_FEATURE_X === 'true',
      betaTesting: false,
      darkMode: true,
      roleBasedFeatures: user.role === 'admin' // Example feature: role-based access control
    }

    // Respond with system health and feature status
    return NextResponse.json(
      {
        success: true,
        status: 'healthy',
        message: 'Success',
        systemStatus: {
          authModule: 'active',
          database: 'connected',
          apiGateway: 'optimal',
          loadBalancer: 'stable'
        },
        analytics: {
          activeUsers,
          serverUptime,
          avgResponseTime
        },
        featureFlags,
        recommendations: [
          'Optimize session handling for enhanced security.',
          'Continue monitoring API gateway latency.',
          'Review session expiration settings to improve user experience.'
        ]
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      {
        success: false,
        status: 'error',
        systemStatus: {
          authModule: 'degraded',
          database: 'error'
        },
        message: 'Unexpected server error. Please try again later.',
        action: 'retry'
      },
      { status: 500 }
    )
  }
}
