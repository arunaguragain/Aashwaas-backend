import z from "zod";
import { ReviewSchema } from "../types/review.type";

export const CreateReviewDTO = ReviewSchema.pick({
    rating: true,
    comment: true,
});

export type CreateReviewDTO = z.infer<typeof CreateReviewDTO>;

export const UpdateReviewDTO = ReviewSchema.partial();

export type UpdateReviewDTO = z.infer<typeof UpdateReviewDTO>;
