/* istanbul ignore file */
import { PasswordResetModel, IPasswordReset } from "../models/passwordReset.model";
import mongoose from "mongoose";

export interface IPasswordResetRepository {
    create(payload: Partial<IPasswordReset>): Promise<IPasswordReset>;
    findLatestByUser(userId: string): Promise<IPasswordReset | null>;
    markUsed(id: string): Promise<void>;
    incrementAttempts(id: string): Promise<number>;
    deleteById(id: string): Promise<void>;
}

export class PasswordResetRepository implements IPasswordResetRepository {
    async create(payload: Partial<IPasswordReset>): Promise<IPasswordReset> {
        const doc = new PasswordResetModel(payload as any);
        return await doc.save();
    }

    async findLatestByUser(userId: string): Promise<IPasswordReset | null> {
        return await PasswordResetModel.findOne({ userId: new mongoose.Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .exec();
    }

    async markUsed(id: string): Promise<void> {
        await PasswordResetModel.findByIdAndUpdate(id, { used: true }).exec();
    }

    async incrementAttempts(id: string): Promise<number> {
        const doc = await PasswordResetModel.findByIdAndUpdate(id, { $inc: { attempts: 1 } }, { new: true }).exec();
        return doc?.attempts ?? 0;
    }

    async deleteById(id: string): Promise<void> {
        await PasswordResetModel.findByIdAndDelete(id).exec();
    }
}
