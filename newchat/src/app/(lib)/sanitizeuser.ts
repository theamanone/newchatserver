export function sanitizeUser(user: any) {
    const {
      password,
      verificationToken,
      email,
      followers,
      following,
      totalFollowers,
      totalFollowing,
      verificationTokenExpires,
      posts,
      subscriptionStartDate,
      subscriptionEndDate,
      refreshToken,
      resetPasswordToken,
      resetPasswordExpires,
      isVerified,
      isActive,
      isSuspended,
      suspensionReason,
      suspensionExpiresAt,
      createdAt,
      updatedAt,
      _id,
      __v,
      ...safeUser
    } = user.toObject();
    return safeUser;
  }