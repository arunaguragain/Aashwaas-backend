import mongoose, { Document, Schema } from "mongoose";
import { WishlistType } from "../types/wishlist.type";

const WishlistSchema: Schema = new Schema<WishlistType>({
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: ['Clothes', 'Books', 'Electronics', 'Furniture', 'Food', 'Other'] },
    plannedDate: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    donorId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    status: { type: String, enum: ['active', 'fulfilled', 'cancelled'], default: 'active' },
}, {
    timestamps: true,
});

export interface IWishlist extends WishlistType, Document {
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export const WishlistModel = mongoose.model<IWishlist>('Wishlist', WishlistSchema);
