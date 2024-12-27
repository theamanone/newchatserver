import nodemailer from 'nodemailer'
import User from '../models/user.model'
import crypto from 'crypto'

/**
 * Sends an email for verification or password reset.
 *
 * @param {Object} params - The parameters for sending the email.
 * @param {string} params.email - The recipient's email address.
 * @param {string} params.emailType - The type of email to send ("VERIFY" or "RESET").
 * @param {string} params.userId - The ID of the user associated with the email.
 *
 * @returns {Promise<any>} - The response from the email service.
 *
 * @throws {Error} - Throws an error if email sending fails.
 */
export const sendEmail = async ({
  email,
  emailType,
  userId
}: {
  email: string
  emailType: string
  userId: string
}): Promise<any> => {
  try {
    // Generate a random token
    const token = crypto.randomBytes(32).toString('hex')

    // Set token expiry to 1 hour
    const tokenExpiry = Date.now() + 3600000 // 1 hour expiry

    // Update the user document with the appropriate token and expiry date
    if (emailType === 'VERIFY') {
      await User.findByIdAndUpdate(userId, {
        verificationToken: token,
        verificationTokenExpires: tokenExpiry
    })
    } else if (emailType === 'RESET') {
      await User.findByIdAndUpdate(userId, {
        resetPasswordToken: token,
        resetPasswordExpires: tokenExpiry
      })
    } else {
      throw new Error('Invalid email type')
    }

    const transport = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE || 'gmail',
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT!, 10),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'no-reply@yourapp.com',
      to: email,
      subject:
        emailType === 'VERIFY' ? 'Verify your email' : 'Reset your password',
      html: `
        <p>Click <a href="${process.env.DOMAIN}/${
        emailType === 'VERIFY' ? 'verifyemail' : 'reset-password'
      }?token=${token}">
        here</a> to ${
          emailType === 'VERIFY' ? 'verify your email' : 'reset your password'
        }.</p>
        <p>Alternatively, you can copy and paste the following link into your browser:<br>
        ${process.env.DOMAIN}/${
        emailType === 'VERIFY' ? 'verifyemail' : 'reset-password'
      }?token=${token}</p>
      `
    }

    // Send the email
    const mailResponse = await transport.sendMail(mailOptions)
    return mailResponse
  } catch (error: any) {
    // Log the error for debugging purposes
    console.error('Error sending email:', error)
    throw new Error(`Failed to send email: ${error.message}`)
  }
}
