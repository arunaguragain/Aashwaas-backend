import z from 'zod';

export const WishlistSchema = z.object({
    title: z.string().min(2, "Wishlist title must be at least 2 characters"),
    category: z.enum([
        'Clothes',
        'Books',
        'Electronics',
        'Furniture',
        'Food',
        'Other'
    ]),
    plannedDate: z.string().min(4, "Planned date is required"),
    notes: z.string().optional(),
    donorId: z.string().optional(),
    status: z.enum(['active', 'fulfilled', 'cancelled']).default('active'),
});

export type WishlistType = z.infer<typeof WishlistSchema>;
