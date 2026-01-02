import mongoose, { Document, Schema } from "mongoose";
import { UserType } from "../types/user.type";
const UserSchema: Schema = new Schema<UserType>(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        name: { type: String, required: true },
        role: {
            type: String,
            enum: ['admin', 'donor', 'volunteer'],
            default: 'donor',
        }
    },
    {
        timestamps: true, 
    }
);

export interface IUser extends UserType, Document { 
    _id: mongoose.Types.ObjectId; 
    updatedAt: Date;
}

export const UserModel = mongoose.model<IUser>('User', UserSchema);
