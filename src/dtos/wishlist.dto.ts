import z from "zod";
import { WishlistSchema } from "../types/wishlist.type";

export const CreateWishlistDTO = WishlistSchema.pick({
    title: true,
    category: true,
    plannedDate: true,
    notes: true,
});

export type CreateWishlistDTO = z.infer<typeof CreateWishlistDTO>;

export const UpdateWishlistDTO = WishlistSchema.partial();
export type UpdateWishlistDTO = z.infer<typeof UpdateWishlistDTO>;
