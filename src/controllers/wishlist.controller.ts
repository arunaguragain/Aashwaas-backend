import { Request, Response, NextFunction } from "express";
import { CreateWishlistDTO, UpdateWishlistDTO } from "../dtos/wishlist.dto";
import z from "zod";
import { WishlistService } from "../services/wishlist.service";
import { QueryParams } from "../types/query.type";

let wishlistService = new WishlistService();

export class WishlistController {
    async createWishlist(req: Request, res: Response, next: NextFunction) {
        try {
            const parsedData = CreateWishlistDTO.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json({ success: false, message: z.prettifyError(parsedData.error) });
            }

            const wishlistData: CreateWishlistDTO = parsedData.data;
            const donorId = req.user?._id?.toString();

            if (!donorId) {
                return res.status(401).json({ success: false, message: "User not authenticated" });
            }

            const newWishlist = await wishlistService.createWishlist(wishlistData as any, donorId);
            return res.status(201).json({ success: true, message: "Wishlist created successfully", data: newWishlist });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async getAllWishlists(req: Request, res: Response, next: NextFunction) {
        try {
            const { page, size }: QueryParams = req.query;
            const { wishlists, pagination } = await wishlistService.getAllWishlists(page, size);
            return res.status(200).json({ success: true, data: wishlists, pagination, message: "All wishlists retrieved" });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async getWishlistById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id;
            const wishlist = await wishlistService.getWishlistById(id);
            return res.status(200).json({ success: true, data: wishlist, message: "Wishlist retrieved successfully" });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async getWishlistsByDonorId(req: Request, res: Response, next: NextFunction) {
        try {
            const donorId = req.params.donorId;
            const { page, size }: QueryParams = req.query;
            const { wishlists, pagination } = await wishlistService.getWishlistsByDonorId(donorId, page, size);
            return res.status(200).json({ success: true, data: wishlists, pagination, message: "Donor wishlists retrieved" });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async getMyWishlists(req: Request, res: Response, next: NextFunction) {
        try {
            const donorId = req.user?._id?.toString();
            if (!donorId) {
                return res.status(401).json({ success: false, message: "User not authenticated" });
            }
            const { page, size }: QueryParams = req.query;
            const { wishlists, pagination } = await wishlistService.getWishlistsByDonorId(donorId, page, size);
            return res.status(200).json({ success: true, data: wishlists, pagination, message: "Your wishlists retrieved" });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async updateWishlist(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id;
            const parsedData = UpdateWishlistDTO.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json({ success: false, message: z.prettifyError(parsedData.error) });
            }

            const updateData: UpdateWishlistDTO = parsedData.data;
            const updated = await wishlistService.updateWishlist(id, updateData as any);
            return res.status(200).json({ success: true, message: "Wishlist updated successfully", data: updated });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async deleteWishlist(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id;
            const deleted = await wishlistService.deleteWishlist(id);
            if (!deleted) {
                return res.status(404).json({ success: false, message: "Wishlist not found" });
            }
            return res.status(200).json({ success: true, message: "Wishlist deleted successfully" });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }
}
