import { UserService } from "../services/user.service";
import { CreateUserDTO, LoginUserDTO, UpdateUserDTO } from "../dtos/user.dto";
import { Request, Response, NextFunction } from "express";
import z from "zod";
import { HttpError } from "../errors/http-error";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";

let userService = new UserService();
/* istanbul ignore next */
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
/* istanbul ignore next */
const GOOGLE_AUDIENCES = (process.env.GOOGLE_CLIENT_ID || '')
    .split(',')
    .map(s => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);

export class AuthController {
    async whoami(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }
            return res.status(200).json({ success: true, data: req.user, message: "Authenticated user info" });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }
    async register(req: Request, res: Response) {
        try {
            const parsedData = CreateUserDTO.safeParse(req.body); 
            if (!parsedData.success) { 
                return res.status(400).json(
                    { success: false, message: z.prettifyError(parsedData.error) }
                )
            }
            const userData: CreateUserDTO = parsedData.data;
            const newUser = await userService.registerUser(userData);
            return res.status(201).json(
                { success: true, message: "User Registered", data: newUser }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async login(req: Request, res: Response) {
        try {
            const parsedData = LoginUserDTO.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json(
                    { success: false, message: z.prettifyError(parsedData.error) }
                )
            }
            const loginData: LoginUserDTO = parsedData.data;
            const { token, existingUser } = await userService.loginUser(loginData);
            return res.status(200).json(
                { success: true, message: "Login successful", data: existingUser, token }
            );

        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async googleSignIn(req: Request, res: Response, next: NextFunction) {
        try {
            const { idToken } = req.body;
            if (!idToken) {
                return res.status(400).json({ success: false, message: "idToken is required" });
            }
            /* istanbul ignore next */
            const audience = GOOGLE_AUDIENCES.length > 1 ? GOOGLE_AUDIENCES : GOOGLE_AUDIENCES[0];
            const ticket = await googleClient.verifyIdToken({
                idToken,
                audience,
            });
            const payload = ticket.getPayload();
            if (!payload || !payload.email) {
                return res.status(400).json({ success: false, message: "Invalid Google token" });
            }
            // Optional: reject if email is not verified by Google
            if (payload.email_verified === false) {
                return res.status(400).json({ success: false, message: "Google email not verified" });
            }

            // decide whether the request is a login or registration attempt
            const { action } = req.body as any;
            let user;

            if (action === 'login') {
                // login should only succeed if the account already exists
                const existing = await userService.getUserByEmail(payload.email);
                if (!existing) {
                    return res.status(400).json({ success: false, message: 'Email not registered' });
                }
                user = existing;
            } else if (action === 'register') {
                // explicit registration: reject if already present, otherwise create
                const existing = await userService.getUserByEmail(payload.email);
                if (existing) {
                    return res.status(400).json({ success: false, message: 'Email already registered' });
                }
                user = await userService.findOrCreateFromGoogle({
                    email: payload.email,
                    name: payload.name,
                    picture: payload.picture,
                });
            } else {
                // no action specified (or unknown); behave like prior implementation
                user = await userService.findOrCreateFromGoogle({
                    email: payload.email,
                    name: payload.name,
                    picture: payload.picture,
                });
            }

            const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
            return res.status(200).json({ success: true, message: "Login successful", data: user, token });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async updateProfile(req: Request, res: Response) {
        try {
            const userId = req.user?._id;

            if (!userId) {
                return res.status(400).json(
                    { success: false, message: "User Id Not found" }
                );
            }

            const parsedData = UpdateUserDTO.safeParse(req.body); 
            if (!parsedData.success) { 
                return res.status(400).json(
                    { success: false, message: z.prettifyError(parsedData.error) }
                )
            }

            if (req.file) {
                parsedData.data.profilePicture = req.file.filename;
            }

            const updatedUser = await userService.updateUser(userId, parsedData.data);
            return res.status(200).json(
                { success: true, message: "Profile Updated", data: updatedUser }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async getUserById(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.params.id;
            const user = await userService.getUserById(userId);
            return res.status(200).json(
                { success: true, data: user, message: "Single User Retrieved" }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    // optional endpoint for frontend pre‑check
    async exists(req: Request, res: Response) {
        try {
            const email = ((req.query && (req.query as any).email) || (req.body && req.body.email)) as string;
            if (!email) {
                return res.status(400).json({ success: false, message: 'Email is required' });
            }
            const user = await userService.getUserByEmail(email);
            return res.status(200).json({ success: true, exists: !!user });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message || 'Internal Server Error' });
        }
    }

    async sendResetPasswordEmail(req: Request, res: Response) {
        try {
            const email = req.body.email;
            const user = await userService.sendResetPasswordEmail(email);
            return res.status(200).json(
                { success: true,
                    data: user,
                    message: "If the email is registered, a reset link has been sent." }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async sendResetPasswordOTP(req: Request, res: Response) {
        try {
            const email = req.body.email;
            await userService.sendResetPasswordOTP(email);
            return res.status(200).json({ success: true, message: "If the email is registered, an OTP has been sent." });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async resetPasswordWithOTP(req: Request, res: Response) {
        try {
            const { email, otp, newPassword } = req.body;
            await userService.resetPasswordWithOTP(email, otp, newPassword);
            return res.status(200).json({ success: true, message: "Password has been reset successfully." });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async resetPassword(req: Request, res: Response) {
        try {
            const token = req.params.token;
            const { newPassword } = req.body;
            await userService.resetPassword(token, newPassword);
            return res.status(200).json(
                { success: true, message: "Password has been reset successfully." }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }
}