import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import User from "@/app/models/user.model";
import crypto from "crypto";
import bcrypt from "bcrypt";
import dbConnect from "@/dbConfig/dbConfig"; // Ensure this path is correct
import nodemailer from "nodemailer";
import { sendEmail } from "@/app/(lib)/mailer";

// Ensure MongoDB connection is established
dbConnect();

export async function POST(request: NextRequest) {
  try {
    const { token, password, emailOrUsername, type } = await request.json();
    console.log("passwrod : ", password);
    console.log("token ", token);
    console.log("emailOrUsername ", emailOrUsername);
    console.log("type ", type);

    if (type === "request") {
      // Handle password reset request
      if (!emailOrUsername) {
        return NextResponse.json(
          { message: "Email or username is required." },
          { status: 400 }
        );
      }

      const user = await User.findOne({
        $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
      });

      if (!user) {
        return NextResponse.json(
          { message: "User not found." },
          { status: 404 }
        );
      }

      const sendMailResponse = await sendEmail({
        email: user.email,
        emailType: "RESET",
        userId: user._id,
      });
      // console.log("send mail res : ", sendMailResponse);

      return NextResponse.json(
        { message: "Reset link sent to your email.", success: true },
        { status: 200 }
      );
    } else if (type === "reset") {
      // Handle password reset
      if (!token || !password) {
        return NextResponse.json(
          { message: "Token and password are required." },
          { status: 400 }
        );
      }

      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        return NextResponse.json(
          { message: "Invalid or expired token." },
          { status: 400 }
        );
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      console.log("New hashed password: ", hashedPassword);

      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      console.log("User password after saving: ", user.password);

      return NextResponse.json(
        { message: "Password successfully reset.", success: true },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: "Invalid request type." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
