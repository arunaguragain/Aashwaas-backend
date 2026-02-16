import { Request, Response, NextFunction } from "express";
import { CreateReviewDTO, UpdateReviewDTO } from "../dtos/review.dto";
import z from "zod";
import { QueryParams } from "../types/query.type";
import { ReviewService } from "../services/review.service";

let reviewService = new ReviewService();

export class ReviewController {
    async createReview(req: Request, res: Response, next: NextFunction) {
        try {
            const parsed = CreateReviewDTO.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ success: false, message: z.prettifyError(parsed.error) });
            }

            const reviewData: CreateReviewDTO = parsed.data;
            const userId = req.user?._id?.toString();
            if (!userId) {
                return res.status(401).json({ success: false, message: "User not authenticated" });
            }

            const newReview = await reviewService.createReview(reviewData as any, userId);
            return res.status(201).json({ success: true, message: "Review created", data: newReview });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async getAllReviews(req: Request, res: Response, next: NextFunction) {
        try {
            const { page, size }: QueryParams = req.query;
            const { reviews, pagination } = await reviewService.getAllReviews(page, size);
            return res.status(200).json({ success: true, data: reviews, pagination, message: "All reviews retrieved" });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async getReviewById(req: Request, res: Response, next: NextFunction) {
        try {
            const reviewId = req.params.id;
            const review = await reviewService.getReviewById(reviewId);
            return res.status(200).json({ success: true, data: review, message: "Review retrieved" });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async getMyReviews(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?._id?.toString();
            if (!userId) {
                return res.status(401).json({ success: false, message: "User not authenticated" });
            }
            const { page, size }: QueryParams = req.query;
            const { reviews, pagination } = await reviewService.getReviewsByUserId(userId, page, size);
            return res.status(200).json({ success: true, data: reviews, pagination, message: "Your reviews retrieved" });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async updateReview(req: Request, res: Response, next: NextFunction) {
        try {
            const reviewId = req.params.id;
            const parsed = UpdateReviewDTO.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ success: false, message: z.prettifyError(parsed.error) });
            }

            const updateData: UpdateReviewDTO = parsed.data;
            const userId = req.user?._id?.toString();
            const updated = await reviewService.updateReview(reviewId, updateData as any, userId);
            return res.status(200).json({ success: true, message: "Review updated", data: updated });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async deleteReview(req: Request, res: Response, next: NextFunction) {
        try {
            const reviewId = req.params.id;
            const userId = req.user?._id?.toString();
            const deleted = await reviewService.deleteReview(reviewId, userId);
            if (!deleted) {
                return res.status(404).json({ success: false, message: "Review not found" });
            }
            return res.status(200).json({ success: true, message: "Review deleted" });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }
}
