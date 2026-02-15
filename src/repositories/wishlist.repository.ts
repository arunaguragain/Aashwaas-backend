import { WishlistModel, IWishlist } from "../models/wishlist.model";

export interface IWishlistRepository {
    createWishlist(data: Partial<IWishlist>): Promise<IWishlist>;
    getWishlistById(id: string): Promise<IWishlist | null>;
    getAllWishlists(page: number, size: number): Promise<{ wishlists: IWishlist[]; total: number }>;
    getWishlistsByDonorId(donorId: string, page: number, size: number): Promise<{ wishlists: IWishlist[]; total: number }>;
    updateWishlist(id: string, updateData: Partial<IWishlist>): Promise<IWishlist | null>;
    deleteWishlist(id: string): Promise<boolean>;
}

export class WishlistRepository implements IWishlistRepository {
    async createWishlist(data: Partial<IWishlist>): Promise<IWishlist> {
        const w = new WishlistModel(data);
        return await w.save();
    }

    async getWishlistById(id: string): Promise<IWishlist | null> {
        return await WishlistModel.findById(id).populate('donorId', 'name email');
    }

    async getAllWishlists(page: number, size: number): Promise<{ wishlists: IWishlist[]; total: number }> {
        const [wishlists, total] = await Promise.all([
            WishlistModel.find()
                .skip((page - 1) * size)
                .limit(size)
                .populate('donorId', 'name email'),
            WishlistModel.countDocuments(),
        ]);

        return { wishlists, total };
    }

    async getWishlistsByDonorId(donorId: string, page: number, size: number): Promise<{ wishlists: IWishlist[]; total: number }> {
        const filter = { donorId } as any;
        const [wishlists, total] = await Promise.all([
            WishlistModel.find(filter)
                .skip((page - 1) * size)
                .limit(size)
                .populate('donorId', 'name email'),
            WishlistModel.countDocuments(filter),
        ]);

        return { wishlists, total };
    }

    async updateWishlist(id: string, updateData: Partial<IWishlist>): Promise<IWishlist | null> {
        return await WishlistModel.findByIdAndUpdate(id, updateData, { new: true }).populate('donorId', 'name email');
    }

    async deleteWishlist(id: string): Promise<boolean> {
        const result = await WishlistModel.findByIdAndDelete(id);
        return result ? true : false;
    }
}
