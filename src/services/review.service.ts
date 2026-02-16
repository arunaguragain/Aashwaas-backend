import { ReviewRepository } from "../repositories/review.repository";
import { IReview } from "../models/review.model";
import { HttpError } from "../errors/http-error";

let reviewRepository = new ReviewRepository();

export class ReviewService {
    async createReview(reviewData: Partial<IReview>, userId: string) {
        if (!userId) {
            throw new HttpError(400, "User ID is required");
        }

        reviewData.userId = userId as any;

        const newReview = await reviewRepository.createReview(reviewData);
        return newReview;
    }

    async getAllReviews(page?: string, size?: string) {
        const pageNumber = page ? parseInt(page) : 1;
        const pageSize = size ? parseInt(size) : 10;
        const { reviews, total } = await reviewRepository.getAllReviews(pageNumber, pageSize);
        const pagination = {
            page: pageNumber,
            size: pageSize,
            totalItems: total,
            totalPages: Math.ceil(total / pageSize),
        };

        return { reviews, pagination };
    }

    async getReviewById(id: string) {
        if (!id) {
            throw new HttpError(400, "Review ID is required");
        }
        const review = await reviewRepository.getReviewById(id);
        if (!review) {
            throw new HttpError(404, "Review not found");
        }
        return review;
    }

    async getReviewsByUserId(userId: string, page?: string, size?: string) {
        if (!userId) {
            throw new HttpError(400, "User ID is required");
        }
        const pageNumber = page ? parseInt(page) : 1;
        const pageSize = size ? parseInt(size) : 10;
        const { reviews, total } = await reviewRepository.getReviewsByUserId(userId, pageNumber, pageSize);
        const pagination = {
            page: pageNumber,
            size: pageSize,
            totalItems: total,
            totalPages: Math.ceil(total / pageSize),
        };

        return { reviews, pagination };
    }

    async updateReview(id: string, updateData: Partial<IReview>, userId?: string) {
        if (!id) {
            throw new HttpError(400, "Review ID is required");
        }

        const review = await reviewRepository.getReviewById(id);
        if (!review) {
            throw new HttpError(404, "Review not found");
        }

        // Only author can update — normalize populated user objects or raw ObjectId
        if (userId) {
            const reviewOwnerId = (() => {
                const uid: any = review.userId;
                if (!uid) return undefined;
                if (typeof uid === 'string') return uid;
                if (uid._id) return uid._id.toString();
                if (uid.id) return uid.id.toString();
                try { return uid.toString(); } catch { return undefined; }
            })();

            if (!reviewOwnerId || reviewOwnerId !== userId) {
                throw new HttpError(403, "Not authorized to update this review");
            }
        }

        const updated = await reviewRepository.updateReview(id, updateData);
        return updated;
    }

    async deleteReview(id: string, userId?: string) {
        if (!id) {
            throw new HttpError(400, "Review ID is required");
        }

        const review = await reviewRepository.getReviewById(id);
        if (!review) {
            throw new HttpError(404, "Review not found");
        }

        if (userId) {
            const reviewOwnerId = (() => {
                const uid: any = review.userId;
                if (!uid) return undefined;
                if (typeof uid === 'string') return uid;
                if (uid._id) return uid._id.toString();
                if (uid.id) return uid.id.toString();
                try { return uid.toString(); } catch { return undefined; }
            })();

            if (!reviewOwnerId || reviewOwnerId !== userId) {
                throw new HttpError(403, "Not authorized to delete this review");
            }
        }

        const deleted = await reviewRepository.deleteReview(id);
        return deleted;
    }
}
