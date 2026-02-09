import mongoose, { Document, Schema } from "mongoose";
import { DonationType } from "../types/donation.type";

const DonationSchema: Schema = new Schema<DonationType>({
    itemName: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: ['Clothes', 'Books', 'Electronics', 'Furniture', 'Food', 'Other'] },
    description: { type: String, trim: true},
    quantity: { type: String, required: true, trim: true},
    condition: { type: String, required: true, enum: ['New', 'Like New', 'Good', 'Fair']},
    pickupLocation: { type: String, required: true, trim: true},
    media: { type: String, trim: true},
    donorId: { type: Schema.Types.ObjectId, required: true, ref: 'User'},
    status: { type: String,enum: ['pending', 'approved', 'assigned', 'completed', 'cancelled'],default: 'pending'},
}, {
    timestamps: true, 
});

export interface IDonation extends DonationType, Document { 
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export const DonationModel = mongoose.model<IDonation>('Donation', DonationSchema);
