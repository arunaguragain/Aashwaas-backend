import z from 'zod';

export const ReviewSchema = z.object({
    rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
    comment: z.string().optional(),
    userId: z.string().optional(),
});

export type ReviewType = z.infer<typeof ReviewSchema>;
