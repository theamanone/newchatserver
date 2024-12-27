import NextAuth, { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import User from '@/app/models/user.model'
import dbConnect from '@/dbConfig/dbConfig'
import bcrypt from 'bcrypt'
import { generateAccessAndRefereshTokens } from '@/app/(lib)/generateAccessAndRefereshTokens'
import { sendEmail } from '@/app/(lib)/mailer'
import { UAParser } from 'ua-parser-js' // Import ua-parser-js for device type

interface UserType {
  id: string
  name: string
  email: string
  isVerified: boolean
}

const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        emailOrUsername: { label: 'Email or Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize (credentials, req: any): Promise<any | null> {
        await dbConnect()

        if (!credentials?.emailOrUsername || !credentials?.password) {
          throw new Error('Please provide both email and password.')
        }

        // Find user by email or username
        const user = await User.findOne({
          $or: [
            { email: credentials?.emailOrUsername },
            { username: credentials?.emailOrUsername }
          ]
        })

        if (!user) {
          throw new Error(
            'No account found with that email. Please create an account.'
          )
        }

        if (!user.isVerified) {
          await sendEmail({
            email: user.email,
            emailType: 'VERIFY',
            userId: user._id.toString()
          })
          throw new Error(
            'Your account is not verified. Please check your inbox for verification.'
          )
        }

        // Validate password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )
        if (!isPasswordValid) {
          throw new Error('Invalid credentials. Please try again.')
        }

        // Get IP address from the request headers
        const ipAddress =
          req?.headers?.['x-forwarded-for'] ||
          req?.connection?.remoteAddress ||
          'Unknown'

        // Get device type using user-agent string
        const userAgent = req?.headers['user-agent'] || ''
        const deviceType = UAParser(userAgent)?.device?.type || 'Unknown'

        // Generate tokens and handle session creation
        const { deviceId } = await generateAccessAndRefereshTokens(user._id)

        // Enforce session limit of 4
        if (user.sessions.length >= 4) {
          user.sessions.shift() // Remove the oldest session if limit exceeded
        }

        user.sessions.push({
          deviceId,
          loginAt: new Date(),
          ipAddress,
          deviceType
        })

        await user.save()

        // Add tokens to user object for JWT
        return {
          id: user._id.toString(),
          name: user.username,
          email: user.email,
          isVerified: user.isVerified,
          deviceId,
          role:  'superadmin'
          // role: user.username === 'aman' ? 'superadmin' : 'user'
        }
      }
    })
  ],

  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 365, // 1 year (in seconds)
    updateAge: 60 * 60 * 24 * 30 // Update JWT every 30 days
  },

  callbacks: {
    async signIn ({ user }: any) {
      await dbConnect()

      const existingUser = await User.findOne({ email: user.email })

      if (!existingUser) {
        throw new Error('User not found.')
      }

      if (!existingUser.isVerified) {
        // await sendEmail({
        //   email: existingUser.email,
        //   emailType: "VERIFY",
        //   userId: existingUser._id,
        // });
        throw new Error('Please verify your email before logging in.')
      }

      return true
    },

    async jwt ({ token, user }: any) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.email = user.email
        token.deviceId = user.deviceId
        // Add role based on username
        token.role = 'superadmin'

        // Set long expiry for JWT token
        const oneYearInSeconds = 60 * 60 * 24 * 365 // 1 year
        token.exp = Math.floor(Date.now() / 1000) + oneYearInSeconds
      }
      return token
    },

    async session ({ session, token }: any) {
      session.user = {
        id: token.id,
        username: token.username,
        email: token.email,
        deviceId: token.deviceId, // Add deviceId to track the session
        role: token.role // Add role to session
      }

      session.expires = new Date(token.exp * 1000).toISOString()
      return session
    }
  },

  events: {
    async signOut ({ token }: any) {
      // Handle database cleanup when the user signs out
      try {
        await dbConnect()
        const { deviceId, id } = token
        // console.log('logut token data : ', deviceId, ' : id : ', id)

        if (!deviceId || !id) {
          console.log(
            'Device ID or User ID missing in token, skipping database cleanup.'
          )
          return
        }

        // Find the user by their ID
        const user = await User.findById(id)
        if (!user) {
          console.log('User not found during sign-out cleanup.')
          return
        }

        // Remove the session corresponding to the deviceId
        const sessionIndex = user.sessions.findIndex(
          (session: any) => session.deviceId === deviceId
        )
        // console.log('sessionIndex : ', sessionIndex)
        if (sessionIndex !== -1) {
          // If session found, remove it
          user.sessions.splice(sessionIndex, 1)
          await user.save()
          // console.log(
          //   `Session with deviceId ${deviceId} removed during sign-out.`
          // )
        } else {
          console.log(`No session found for deviceId ${deviceId}.`)
        }
      } catch (error) {
        console.error('Error during sign-out cleanup:', error)
      }
    }
  },

  secret: process.env.NEXTAUTH_SECRET
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
