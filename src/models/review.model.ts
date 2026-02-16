import mongoose, { Document, Schema } from "mongoose";
import { ReviewType } from "../types/review.type";

const ReviewSchema: Schema = new Schema<ReviewType>({
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
}, {
    timestamps: true,
});

export interface IReview extends ReviewType, Document {
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export const ReviewModel = mongoose.model<IReview>('Review', ReviewSchema);
