import { WishlistRepository } from "../repositories/wishlist.repository";
import { IWishlist } from "../models/wishlist.model";
import { HttpError } from "../errors/http-error";

let wishlistRepository = new WishlistRepository();

export class WishlistService {
    async createWishlist(wishlistData: Partial<IWishlist>, donorId: string) {
        if (!donorId) {
            throw new HttpError(400, "Donor ID is required");
        }

        wishlistData.donorId = donorId as any;
        wishlistData.status = wishlistData.status || 'active';

        const newWishlist = await wishlistRepository.createWishlist(wishlistData);
        return newWishlist;
    }

    async getAllWishlists(page?: string, size?: string) {
        const pageNumber = page ? parseInt(page) : 1;
        const pageSize = size ? parseInt(size) : 10;
        const { wishlists, total } = await wishlistRepository.getAllWishlists(pageNumber, pageSize);
        const pagination = {
            page: pageNumber,
            size: pageSize,
            totalItems: total,
            totalPages: Math.ceil(total / pageSize),
        };

        return { wishlists, pagination };
    }

    async getWishlistById(id: string) {
        if (!id) {
            throw new HttpError(400, "Wishlist ID is required");
        }
        const wishlist = await wishlistRepository.getWishlistById(id);
        if (!wishlist) {
            throw new HttpError(404, "Wishlist not found");
        }
        return wishlist;
    }

    async getWishlistsByDonorId(donorId: string, page?: string, size?: string) {
        if (!donorId) {
            throw new HttpError(400, "Donor ID is required");
        }
        const pageNumber = page ? parseInt(page) : 1;
        const pageSize = size ? parseInt(size) : 10;
        const { wishlists, total } = await wishlistRepository.getWishlistsByDonorId(donorId, pageNumber, pageSize);
        const pagination = {
            page: pageNumber,
            size: pageSize,
            totalItems: total,
            totalPages: Math.ceil(total / pageSize),
        };

        return { wishlists, pagination };
    }

    async updateWishlist(id: string, updateData: Partial<IWishlist>) {
        if (!id) {
            throw new HttpError(400, "Wishlist ID is required");
        }
        const wishlist = await wishlistRepository.getWishlistById(id);
        if (!wishlist) {
            throw new HttpError(404, "Wishlist not found");
        }

        const updated = await wishlistRepository.updateWishlist(id, updateData);
        return updated;
    }

    async deleteWishlist(id: string) {
        if (!id) {
            throw new HttpError(400, "Wishlist ID is required");
        }
        const wishlist = await wishlistRepository.getWishlistById(id);
        if (!wishlist) {
            throw new HttpError(404, "Wishlist not found");
        }
        const deleted = await wishlistRepository.deleteWishlist(id);
        return deleted;
    }
}
