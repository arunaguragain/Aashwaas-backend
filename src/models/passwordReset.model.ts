import mongoose, { Document, Schema } from "mongoose";

export interface IPasswordReset extends Document {
    userId: mongoose.Types.ObjectId;
    otpHash: string;
    expiresAt: Date;
    used: boolean;
    attempts: number;
    createdAt: Date;
}

const PasswordResetSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        otpHash: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        used: { type: Boolean, default: false },
        attempts: { type: Number, default: 0 },
    },
    { timestamps: true }
);

export const PasswordResetModel = mongoose.model<IPasswordReset>('PasswordReset', PasswordResetSchema);
