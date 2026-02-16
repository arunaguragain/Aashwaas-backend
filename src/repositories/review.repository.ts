import { ReviewModel, IReview } from "../models/review.model";

export interface IReviewRepository {
    createReview(reviewData: Partial<IReview>): Promise<IReview>;
    getReviewById(id: string): Promise<IReview | null>;
    getAllReviews(page: number, size: number): Promise<{ reviews: IReview[]; total: number }>;
    getReviewsByUserId(userId: string, page: number, size: number): Promise<{ reviews: IReview[]; total: number }>;
    updateReview(id: string, updateData: Partial<IReview>): Promise<IReview | null>;
    deleteReview(id: string): Promise<boolean>;
}

export class ReviewRepository implements IReviewRepository {
    async createReview(reviewData: Partial<IReview>): Promise<IReview> {
        const review = new ReviewModel(reviewData);
        return await review.save();
    }

    async getReviewById(id: string): Promise<IReview | null> {
        const review = await ReviewModel.findById(id).populate('userId', 'name email');
        return review;
    }

    async getAllReviews(page: number, size: number): Promise<{ reviews: IReview[]; total: number }> {
        const [reviews, total] = await Promise.all([
            ReviewModel.find()
                .skip((page - 1) * size)
                .limit(size)
                .populate('userId', 'name email'),
            ReviewModel.countDocuments(),
        ]);

        return { reviews, total };
    }

    async getReviewsByUserId(userId: string, page: number, size: number): Promise<{ reviews: IReview[]; total: number }> {
        const filter = { userId } as any;
        const [reviews, total] = await Promise.all([
            ReviewModel.find(filter)
                .skip((page - 1) * size)
                .limit(size)
                .populate('userId', 'name email'),
            ReviewModel.countDocuments(filter),
        ]);

        return { reviews, total };
    }

    async updateReview(id: string, updateData: Partial<IReview>): Promise<IReview | null> {
        const updated = await ReviewModel.findByIdAndUpdate(id, updateData, { new: true }).populate('userId', 'name email');
        return updated;
    }

    async deleteReview(id: string): Promise<boolean> {
        const result = await ReviewModel.findByIdAndDelete(id);
        return result ? true : false;
    }
}
