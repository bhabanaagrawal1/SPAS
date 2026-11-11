/*
🧠 Dependency on which files : prismaClient.js, utils/1.hash.js, /utils/2.jwt.js, email.js 
*/

import prisma from "../../prismaClient.js";

import {hashToken,hashPassword,generateRandomToken, verifyPassword} from "../utils/1.hash.js";
import {signAccessToken,signRefreshToken,refreshTokenExpiryDate, verifyRefreshToken} from "../utils/2.jwt.js";
import config from "../config/config.js"
import {ApiError} from "../utils/3.catchAsync.js";

import {sendVerificationEmail,sendPasswordResetEmail} from "../utils/4.email.js";

async function issueTokenPair({ userId, email,role, userAgent, ipAddress }) {
    const accessToken = signAccessToken({ sub: userId, email,role });
    const refreshToken = signRefreshToken({ sub: userId });
    // Every Prisma write needs the fields nested under a data key — this is Prisma's required shape, not optional structure. As written, Prisma will throw a validation error (Unknown argument tokenHash) because it's looking for data, select, include, etc. as top-level keys, not your actual field names.
    await prisma.refreshToken.create({
        data: {
            tokenHash: hashToken(refreshToken),
            userId,
            expiresAt: refreshTokenExpiryDate(),
            userAgent: userAgent || null,
            ipAddress: ipAddress || null
        }
    });

    return { accessToken, refreshToken };
}


export async function registerUser({ email, password, registrationId }) {
    // 1. Normalize input
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRegistrationId = registrationId.trim();

    // 2. Hash password
    const hashedPassword = await hashPassword(password);

    // 3. Generate email verification token
    const emailVerifyToken = generateRandomToken();

    // Store only the hashed token in the database
    const hashedEmailVerifyToken = hashToken(emailVerifyToken);

    // 4. Calculate token expiry
    const emailVerifyExpires = new Date(
        Date.now() + config.tokenExpiry.emailVerifyMs
    );

    let user;

    // 5. Create user and link the correct profile atomically
    try {
        user = await prisma.$transaction(async (tx) => {

            // Check whether an account already exists
            const existingUser = await tx.user.findUnique({
                where: { email: normalizedEmail }
            });

            if (existingUser) {
                if (!existingUser.isEmailVerified) {
                    throw new ApiError(
                        409,
                        "An account already exists with this email. Please verify your email."
                    );
                }

                throw new ApiError(
                    409,
                    "An account with this email already exists."
                );
            }

            let role;
            let profile;

            // -----------------------------------------
            // Check whether this is a student
            // -----------------------------------------
            const student = await tx.student.findFirst({
                where: {
                    studentId: normalizedRegistrationId,
                    collegeEmail: normalizedEmail
                }
            });

            if (student) {
                if (student.userId) {
                    throw new ApiError(
                        409,
                        "This student already has an account."
                    );
                }

                role = "STUDENT";
                profile = student;
            }

            // -----------------------------------------
            // Otherwise, check whether this is a teacher
            // -----------------------------------------
            else {
                const teacher = await tx.teacher.findFirst({
                    where: {
                        teacherId: normalizedRegistrationId,
                        collegeEmail: normalizedEmail
                    }
                });

                if (!teacher) {
                    throw new ApiError(
                        400,
                        "Registration ID and email do not match."
                    );
                }

                if (teacher.userId) {
                    throw new ApiError(
                        409,
                        "This teacher already has an account."
                    );
                }

                role = "TEACHER";
                profile = teacher;
            }

            // -----------------------------------------
            // Create the User account
            // -----------------------------------------
            const newUser = await tx.user.create({
                data: {
                    email: normalizedEmail,
                    password: hashedPassword,
                    role,
                    isEmailVerified: false,
                    emailVerifyToken: hashedEmailVerifyToken,
                    emailVerifyExpires
                }
            });

            // -----------------------------------------
            // Link the User to the existing profile
            // -----------------------------------------
            if (role === "STUDENT") {

                const result = await tx.student.updateMany({
                    where: {
                        id: profile.id,
                        userId: null
                    },
                    data: {
                        userId: newUser.id
                    }
                });

                if (result.count !== 1) {
                    throw new ApiError(
                        409,
                        "This student profile is already linked to an account."
                    );
                }
            }

            else if (role === "TEACHER") {

                const result = await tx.teacher.updateMany({
                    where: {
                        id: profile.id,
                        userId: null
                    },
                    data: {
                        userId: newUser.id
                    }
                });

                if (result.count !== 1) {
                    throw new ApiError(
                        409,
                        "This teacher profile is already linked to an account."
                    );
                }
            }

            // Return the created user
            return newUser;
        });

    } catch (error) {

        // Handle unique constraint violations
        if (error.code === "P2002") {
            throw new ApiError(
                409,
                "An account with these details already exists."
            );
        }

        throw error;
    }

    // 6. Send verification email AFTER transaction commits
    try {
        await sendVerificationEmail(
            user.email,
            emailVerifyToken
        );

    } catch (error) {

        console.error(
            "Failed to send verification email:",
            error
        );

        // Email delivery failed.
        // Remove the newly created account and unlink its profile.
        try {
            await prisma.$transaction(async (tx) => {

                // Check the role to determine which profile to unlink
                if (user.role === "STUDENT") {
                    await tx.student.updateMany({
                        where: {
                            userId: user.id
                        },
                        data: {
                            userId: null
                        }
                    });
                }

                else if (user.role === "TEACHER") {
                    await tx.teacher.updateMany({
                        where: {
                            userId: user.id
                        },
                        data: {
                            userId: null
                        }
                    });
                }

                // Delete the newly created account
                await tx.user.delete({
                    where: { id: user.id }
                });
            });

        } catch (cleanupError) {
            console.error(
                "Failed to clean up registration:",
                cleanupError
            );
        }

        throw new ApiError(
            500,
            "Unable to send verification email. Please try again."
        );
    }

    // 7. Return safe user information
    return {
        message: "Registration successful. Please verify your email.",

        user: {
            id: user.id,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified
        }
    };
}

export async function verifyUserEmail({token,userAgent,ipAddress}) {
    // Convert the token received from the user
    // into the same hash that we stored in the database.
    const tokenHash = hashToken(token);
    const user = await prisma.user.findFirst({
        where: {
            emailVerifyToken: tokenHash       
        }
    })
    if(!user) {
        throw new ApiError(400,"Invalid or expired verification token");
    }
    if(!user.emailVerifyExpires || user.emailVerifyExpires < new Date()) {
        throw new ApiError(400,"Verification token has expired. Please request a new one.")
    }
    if(user.isEmailVerified){
        throw new ApiError(400,"Email already verified");
    }
    
    const verifiedUser = await prisma.$transaction(
        async(tx) => {
            const updatedUser = await tx.user.update({
                where: {
                    id: user.id
                },
                data: {
                    isEmailVerified: true,
                    emailVerifyToken: null,
                    emailVerifyExpires: null
                }
            })

            if(user.role === "STUDENT"){
                const student = await tx.student.findFirst({
                    where: {
                        collegeEmail: user.email
                    }
                })

                if(!student) {
                    throw new ApiError(400,"Student profile not found");
                }

                if(student.userId) {
                    throw new ApiError(400,"Student profile not found");
                }

                await tx.student.update({
                    where: {
                        id: student.id
                    },
                    data: {
                        userId: user.id
                    }
                })
            }else if(user.role === "TEACHER") {
                const teacher = await tx.teacher.findFirst({
                    where: {
                        collegeEmail: user.email
                    }
                })

                if(!teacher) {
                    throw new ApiError(400,"Teacher profile not found");
                }

                if(teacher.userId) {
                    throw new ApiError(409,"This teacher profile is already linked to an account")
                }

                await tx.teacher.update({
                    where: {
                        id: teacher.id
                    },
                    data: {
                        userId: user.id
                    }
                })
            }
            return updatedUser;
        }
    )

    const {accessToken,refreshToken} = await issueTokenPair({
        userId: verifiedUser.id,
        email: verifiedUser.email,
        role: verifiedUser.role,
        userAgent,
        ipAddress
    })

    return {
        message: "Email verified successfully",
        accessToken,
        refreshToken,
        user: {
            id: verifiedUser.id,
            email: verifiedUser.email,
            role: verifiedUser.role,
            isEmailVerified: verifiedUser.isEmailVerified
        }
    }
}

export async function resendVerificationEmail({email}) {
    const genericResponse = {
        message: "If an account with that email exists and isn't verified, a new verification link has been sent."
    };

    const user = await prisma.user.findUnique({
        where: {
            email
        }
    })

    // If user doesn't exist,
    // return the same generic response.
    if(!user){
        return genericResponse;
    }

    /**
     * why to send generic response even when user.isEmailVerified ?

     * Because of security/privacy. The generic response prevents someone from using your API to discover whether an email address has an account.

        Your code:
        const genericResponse = {
            message:
                "If an account with that email exists and isn't verified, a new verification link has been sent."
        };
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return genericResponse;
        }
        if (user.isEmailVerified) {
            return genericResponse;
        }
        Why do this?

        Imagine we returned different responses:

        email = abc@gmail.com
        → "Email not found"
        and:
        email = xyz@gmail.com
        → "Email is already verified"

        An attacker could send thousands of email addresses to your /resend-verification endpoint and figure out:
        "Does this person have an account on this website?"

        This is called "account/email enumeration".

        With generic response
        For all these cases:

        Email doesn't exist
                ↓
        Generic response

        Email exists but is verified
                ↓
        Generic response

        Email exists and is unverified
                ↓
        Send email + generic response

        The attacker sees the same response:
        {
            "message": "If an account with that email exists and isn't verified, a new verification link has been sent."
        }

        So they can't reliably tell which situation is true.


        1. What stops someone from spamming /resend-verification to flood a user's inbox?
        Nothing yet in this code — this is exactly what generalAuthLimiter (the rate limiter we built earlier) is for. Apply it to this route specifically; without it, this endpoint is a real abuse vector even with the generic-response protection in place, since enumeration and spam are two separate concerns.

        Rate limiting = limiting how many times someone can call an API within a certain time.

     */
    // If email is already verified,
    // return the same generic response.
    if(user.isEmailVerified) {
        return genericResponse;
    }

    const emailVerifyToken = generateRandomToken();
    const tokenHash = hashToken(emailVerifyToken);
    const emailVerifyExpires = new Date(Date.now() + config.tokenExpiry.emailVerifyMs);

    await prisma.user.update({
        where: {
            id: user.id
        },
        data: {
            emailVerifyToken: tokenHash,
            emailVerifyExpires
        }
    })

    sendVerificationEmail(
        user.email,
        emailVerifyToken
    ).catch((error) => {
        console.error(
            "Failed to resend verification email:",
            error
        );
    });
    return genericResponse;
}

export async function loginUser({email,password,userAgent,ipAddress}) {
    const user = await prisma.user.findUnique({
        where: {email}
    })
    // Same error for:
    // - user does not exist
    // - password is incorrect
    //
    // This prevents email enumeration.
    const invalidCredsError = new ApiError(401,"Invalid email or password");
    if(!user) {
        throw invalidCredsError;
    }
    // 2. Check whether the account has a password
    // OAuth/social-login users may not have one.
    if(!user.password) {
        throw new ApiError(400,"This account uses social login. Please sign in with your provider.");
    }
    
    const passwordValid = await verifyPassword(user.password,password);

    if(!passwordValid) {
        throw invalidCredsError;
    }

    if (!user.isEmailVerified) {
        throw new ApiError(
            403,
            "Please verify your email before logging in."
        );
    }

    const { accessToken, refreshToken } = await issueTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
        userAgent,
        ipAddress,
    });

    return {
        accessToken,
        refreshToken,

        user: {
            id: user.id,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified
        }
    };
}

export async function refreshTokens({incomingToken, userAgent,ipAddress}) {
    if(!incomingToken) {
        throw new ApiError(401,"No refresh token provided");
    }
    let payload;
    try {
        // Verify JWT
        payload = verifyRefreshToken(incomingToken);
    }catch {
        throw new ApiError(401,"Invalid or expired refresh token");
    }
    // Hash token
    const tokenHash = hashToken(incomingToken);
    // Find hash in DB
    const stored = await prisma.refreshToken.findUnique({where: {tokenHash},include: {user: true}})

    if(!stored) {
        throw new ApiError(401,"Refresh token is no longer valid");
    }
    /*
    RefreshToken
    ────────────────────
    tokenHash = ABC123
    revoked   = false

    false means: ✅ This token is still valid and can be used.

    Revoke = cancel/invalidate something before its normal expiry.

    For example:
    Refresh token
        ↓
    expires in 7 days

    But if you revoke it after 1 hour:
    Refresh token
        ↓
    REVOKED
        ↓
    cannot be used anymore

    The token may still have 6 days left according to expiresAt, but your application says:
    "Nope, I don't accept this token anymore."

    After: revoked = true
    "This refresh token has been used. It cannot be used again."

    Why do we need this?
    This is where refresh-token rotation comes in.

    // updateMany: Revoke every other active refresh token belonging to this user.

    Token A
    ↓
    valid?
    ↓
    YES
    ↓
    revoke Token A
    ↓
    generate Token B
    ↓
    Token B expires 7 days from NOW

    database:
    Token A
    revoked = true
    expiresAt = next Monday

    Token B
    revoked = false
    expiresAt = next Tuesday

    Token B
    ↓
    valid?
    ↓
    YES
    ↓
    revoke Token B
    ↓
    generate Token C

    This is called refresh-token rotation.

    And importantly, revoking a token doesn't delete it from the database. You keep the record so your server can recognize that someone tried to reuse an old token.

    if User doesn't use the application at all.

    Next Tuesday:
    Token A
    ↓
    expired
    ↓
    ❌ cannot generate Token B

    Because the server needs a valid refresh token to authorize the generation of a new token pair.

    The user would need to log in again.

    if Token A is stolen:
    Attacker
    ↓
    Token A
    ↓
    database
    ↓
    revoked = true
    ↓
    🚨 TOKEN REUSE DETECTED

    So all currently active sessions for that user are revoked.

    expiresAt = time-based invalidation
    revoked   = state-based invalidation

    1. Walk through exactly what happens if an attacker steals a refresh token and uses it once ?
    Ans: If they use it before the real user does, they get a valid new access token — a real compromise, but a bounded one, since the stolen token is now dead (rotated) and unusable again. If the real user's browser later tries to refresh with what is now a stale, already-used token, that request hits the stored.revoked check, and the system responds by revoking every session for that account — cutting off the attacker's new token too, even though it doesn't know exactly which one was stolen.

    2: Why call updateMany to revoke all sessions on reuse detection, rather than just revoking the one token that was reused?
    Ans: Because you don't know how many valid tokens the attacker might still be holding, or whether they've since refreshed further and now hold a newer token than the one you caught. The safe assumption once you've confirmed compromise is "treat the whole account as compromised," not just the one token you happened to see reused.

    */
    if (stored.revoked) {
        await prisma.refreshToken.updateMany({
            where: { userId: stored.userId, revoked: false },
            data: { revoked: true, revokedAt: new Date(), },
        });
        throw new ApiError(401, "Refresh token reuse detected. All sessions have been revoked for your security.");
    }

    if (stored.expiresAt < new Date()) {
        throw new ApiError(401, "Refresh token has expired");
    }
    // user was saved using include: {user: true}
    const user = stored.user;
    if (!user) {
        throw new ApiError(401, "User no longer exists");
    }

    if (!user.isEmailVerified) {
        throw new ApiError(
            403,
            "Please verify your email first"
        );
    }

    await prisma.refreshToken.update({
        where: { tokenHash },
        data: { revoked: true,revokedAt: new Date() },
    });

    const { accessToken, refreshToken } = await issueTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
        userAgent,
        ipAddress,
    });

    return { accessToken, refreshToken };
}

export async function logoutUser({ 
    incomingToken }) {
    if (!incomingToken) {
        return;
    }
    
    const tokenHash = hashToken(incomingToken);
    await prisma.refreshToken.updateMany({
        where: {tokenHash,
            revoked: false},
        data: {revoked: true,revokedAt: new Date(),}, // Now that refresh token cannot be used anymore.
    });
    
    /**
     * if (incomingToken) is false, so we simply skip the database operation.
     */
    return { message: "Logged out successfully" }
}

export async function getCurrentUser({ userId }) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            role: true,
            isEmailVerified: true,
            createdAt: true,
        },
    });
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    return { user };
}

export async function changeUserPassword({ userId, currentPassword, newPassword }) {
    // user ko find karo on the basis of id
    const user = await prisma.user.findUnique({ 
        where: { id: userId } 
    });
    // agar na mile toh
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (!user.password) {
        throw new ApiError(400, "This account uses social login and has no password to change.");
    }

    const valid = await verifyPassword(user.password, currentPassword);

    if (!valid) {
        throw new ApiError(401, "Current password is incorrect");
    }

    const newHashed = await hashPassword(newPassword);

    // Both writes must succeed together, or neither should happen.
    // If the password updated but revocation silently failed, an attacker
    // with an old stolen refresh token would still have access after the
    // user "secured" their account by changing the password.

    // $transaction is a Prisma method used to group multiple database operations into one transaction.
    await prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: { password: newHashed },
        }),
        /**
         * Password → NEW ✅
            Access Token A → still valid
            Refresh Token R → still valid

                    PASSWORD CHANGE
                           ↓
              ┌────────────┴────────────┐
              ↓                         ↓
       Change password          Revoke refresh tokens
              ↓                         ↓
        New password             Old sessions die
                                        ↓
                                Can't get new access
                                tokens

        Changing the password ≠ automatically deleting/invalidation of tokens.
        That's why you explicitly revoke the refresh tokens.
         */
        // For this user, find all active refresh tokens and mark them as unusable.
        prisma.refreshToken.updateMany({
            where: { userId, revoked: false },
            data: { revoked: true,revokedAt: new Date(), },
        }),
    ]);

    return { message: "Password changed successfully. Please log in again." };
}

export async function forgotPassword({email}) {
    const genericResponse = {
        message: "If an account with that email exists, a password reset link has been sent."
    }

    const user = await prisma.user.findUnique({
        where: {
            email
        }
    })

    if(!user) {
        return genericResponse;
    }

    if(!user.password) {
        return genericResponse;
    }

    const resetToken = generateRandomToken();

    await prisma.user.update({
        where: {id: user.id},
        data: {
            resetPasswordToken: hashToken(resetToken),
            resetPasswordExpires: new Date(Date.now() + config.tokenExpiry.passwordResetMs)
        }
    })

    sendPasswordResetEmail(user.email,resetToken).catch((error) => {
       console.error("Failed to send password reset email:", error); 
    })

    return genericResponse;
}

export async function resetPassword({token,newPassword}) {
    if(!token) {
        throw new ApiError(400,"Reset token is required")
    }
    const tokenHash = hashToken(token);

    const user = await prisma.user.findFirst({
        where: { resetPasswordToken: tokenHash },
    })

    if(!user) {
        throw new ApiError(400, "Invalid or expired reset token");
    }

    if(!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
        throw new ApiError(400,"Reset token has expired. Please request a new one.")
    }

    const newHashed = await hashPassword(newPassword);
    // Same transactional pattern as changeUserPassword: update the password
    // AND kill every existing session in one atomic operation. Also clear
    // the reset token fields so it can't be used a second time.
    await prisma.$transaction([
        prisma.user.update({
            where: { id: user.id },
            data: {
                password: newHashed,
                resetPasswordToken: null,
                resetPasswordExpires: null,
            },
        }),
        prisma.refreshToken.updateMany({
            where: { userId: user.id, revoked: false },
            data: { revoked: true, revokedAt: new Date(), },
        }),
    ]);

    return { message: "Password reset successfully. Please log in with your new password." };
}