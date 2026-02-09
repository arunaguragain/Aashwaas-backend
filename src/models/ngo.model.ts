import mongoose, { Document, Schema } from "mongoose";
import { NgoType } from "../types/ngo.type";

const NgoSchema: Schema = new Schema<NgoType>({
    name: { type: String, required: true, trim: true },
    registrationNumber: { type: String, required: true, unique: true, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    address: { type: String, required: true, trim: true },
    focusAreas: [{ type: String, trim: true }],
    photo: { type: String, trim: true },
},{
    timestamps: true,
});

export interface INgo extends NgoType, Document {
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export const NgoModel = mongoose.model<INgo>("Ngo", NgoSchema);
