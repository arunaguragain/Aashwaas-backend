import { CreateUserDTO, LoginUserDTO, UpdateUserDTO } from "../dtos/user.dto";
import { UserRepository } from "../repositories/user.repository";
import { PasswordResetRepository } from "../repositories/passwordReset.repository";
import bcrypts from "bcryptjs";
import { HttpError } from "../errors/http-error";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { sendEmail } from "../config/email";

const CLIENT_URL = process.env.CLIENT_URL as string;
let userRepository = new UserRepository();
let passwordResetRepository = new PasswordResetRepository();

export class UserService{
    async registerUser(data: CreateUserDTO){
        // Business logic, check duplicate username/email, hash
        const checkEmail = await userRepository.getUserByEmail(data.email);
        if(checkEmail){
            throw new HttpError(403, "Email already in use");
        }
        // hash/encrypt password, to not store plain text password - security risk
        const hashedPassword = await bcrypts.hash(data.password, 10); //10 - complexity
        data.password = hashedPassword; //update the password with hased one
        const newUser = await userRepository.createUser(data);
        return newUser;
    }
    async loginUser(data: LoginUserDTO){
        const existingUser = await userRepository.getUserByEmail(data.email);
        if(!existingUser){
            throw new HttpError(404, "User not found");
        }
        const isPasswordValid = await bcrypts.compare(data.password, existingUser.password); 
        if(!isPasswordValid){
            throw new HttpError(401, "Invalid credentials");
        }
        // generate JWT
        const payload = {
            id: existingUser._id,
            email: existingUser.email,
            role: existingUser.role,
        }; // what to include in token
        const token = jwt.sign(payload, JWT_SECRET, {expiresIn: '30d'}); 
        return{token, existingUser}
    }

    async updateUser(id: string, updateData: UpdateUserDTO) {
        const user = await userRepository.getUserById(id);
        if (!user) {
            throw new HttpError(404, "User not found");
        }

        // If password is being updated, hash it
        if (updateData.password) {
            updateData.password = await bcrypts.hash(updateData.password, 10);
        }

        // Check if email is being updated and if it's already in use
        if (updateData.email && updateData.email !== user.email) {
            const emailExists = await userRepository.getUserByEmail(updateData.email);
            if (emailExists) {
                throw new HttpError(403, "Email already in use");
            }
        }

        const updatedUser = await userRepository.updateUser(id, updateData);
        return updatedUser;
    }

    async getUserById(id: string) {
            const user = await userRepository.getUserById(id);
            if (!user) {
                throw new HttpError(404, "User not found");
            }
            return user;
    }

    async getUserByEmail(email: string) {
        if (!email) {
            throw new HttpError(400, "Email is required");
        }
        const user = await userRepository.getUserByEmail(email);
        return user;
    }

    async sendResetPasswordEmail(email?: string) {
        if (!email) {
            throw new HttpError(400, "Email is required");
        }
        const user = await userRepository.getUserByEmail(email);
        if (!user) {
            throw new HttpError(404, "User not found");
        }
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' }); // 1 hour expiry
        const resetLink = `${CLIENT_URL}/reset-password?token=${token}`;
        const html = `<p>Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 1 hour.</p>`;
        await sendEmail(user.email, "Password Reset", html);
        return user;
    }

    async resetPassword(token?: string, newPassword?: string) {
        try {
            if (!token || !newPassword) {
                throw new HttpError(400, "Token and new password are required");
            }
            const decoded: any = jwt.verify(token, JWT_SECRET);
            const userId = decoded.id;
            const user = await userRepository.getUserById(userId);
            if (!user) {
                throw new HttpError(404, "User not found");
            }
            const hashedPassword = await bcrypts.hash(newPassword, 10);
            await userRepository.updateUser(userId, { password: hashedPassword });
            return user;
        } catch (error) {
            throw new HttpError(400, "Invalid or expired token");
        }
    }

    async findOrCreateFromGoogle(data: { email: string; name?: string; picture?: string }) {
        const { email, name, picture } = data;
        if (!email) {
            throw new HttpError(400, "Email is required");
        }
        const existingUser = await userRepository.getUserByEmail(email);
        if (existingUser) return existingUser;

        const randomPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypts.hash(randomPassword, 10);
        const newUser = await userRepository.createUser({
            email,
            name: name || "Google User",
            password: hashedPassword,
            profilePicture: picture || undefined,
        });
        return newUser;
    }

    async sendResetPasswordOTP(email?: string) {
        if (!email) {
            throw new HttpError(400, "Email is required");
        }
        const user = await userRepository.getUserByEmail(email);
        // Do not reveal whether email exists — return success either way.
        if (!user) {
            return;
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypts.hash(otp, 10);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await passwordResetRepository.create({ userId: user._id, otpHash, expiresAt } as any);

        const html = `<p>Your password reset OTP is <strong>${otp}</strong>. It is valid for 10 minutes.</p>`;
        await sendEmail(user.email, "Password Reset OTP", html);
        return;
    }

    async resetPasswordWithOTP(email?: string, otp?: string, newPassword?: string) {
        if (!email || !otp || !newPassword) {
            throw new HttpError(400, "Email, OTP and new password are required");
        }
        const user = await userRepository.getUserByEmail(email);
        if (!user) {
            throw new HttpError(404, "User not found");
        }

        const record = await passwordResetRepository.findLatestByUser(user._id.toString());
        if (!record || record.used || record.expiresAt < new Date()) {
            throw new HttpError(400, "Invalid or expired OTP");
        }

        const isValid = await bcrypts.compare(otp, record.otpHash);
        if (!isValid) {
            const attempts = await passwordResetRepository.incrementAttempts(record._id.toString());
            if (attempts >= 5) {
                await passwordResetRepository.markUsed(record._id.toString());
            }
            throw new HttpError(400, "Invalid OTP");
        }

        const hashedPassword = await bcrypts.hash(newPassword, 10);
        await userRepository.updateUser(user._id.toString(), { password: hashedPassword });
        await passwordResetRepository.markUsed(record._id.toString());
        return user;
    }
}