import { WishlistRepository } from '../../../repositories/wishlist.repository';
import { WishlistModel } from '../../../models/wishlist.model';

describe('WishlistRepository', () => {
  let repo: WishlistRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new WishlistRepository();
  });

  test('deleteWishlist returns true when exists, false otherwise', async () => {
    jest.spyOn(WishlistModel, 'findByIdAndDelete' as any).mockResolvedValueOnce({ _id: 'w1' } as any);
    expect(await repo.deleteWishlist('w1')).toBe(true);
    jest.spyOn(WishlistModel, 'findByIdAndDelete' as any).mockResolvedValueOnce(null as any);
    expect(await repo.deleteWishlist('w2')).toBe(false);
  });

  test('getAllWishlists and getWishlistsByDonorId pagination', async () => {
    const docs = [{ _id: 'w1' }];
    const fakeQuery = {
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValueOnce(docs),
    } as any;
    jest.spyOn(WishlistModel, 'find' as any).mockReturnValueOnce(fakeQuery);
    jest.spyOn(WishlistModel, 'countDocuments' as any).mockResolvedValueOnce(1 as any);
    const out1 = await repo.getAllWishlists(1, 10);
    expect(out1.total).toBe(1);
    expect(out1.wishlists).toEqual(docs);
    expect(fakeQuery.skip).toHaveBeenCalledWith(0);
    expect(fakeQuery.limit).toHaveBeenCalledWith(10);

    const fakeQuery2 = {
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValueOnce(docs),
    } as any;
    const findSpy = jest.spyOn(WishlistModel, 'find' as any).mockReturnValueOnce(fakeQuery2);
    jest.spyOn(WishlistModel, 'countDocuments' as any).mockResolvedValueOnce(1 as any);
    const out2 = await repo.getWishlistsByDonorId('don1', 2, 5);
    expect(out2.total).toBe(1);
    expect(out2.wishlists).toEqual(docs);
    expect(fakeQuery2.skip).toHaveBeenCalledWith(5);
    expect(fakeQuery2.limit).toHaveBeenCalledWith(5);
    expect(findSpy).toHaveBeenCalledWith({ donorId: 'don1' });
  });

  test('getWishlistById returns populated doc', async () => {
    const w = { _id: 'w2' } as any;
    jest.spyOn(WishlistModel, 'findById' as any).mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(w) } as any);
    expect(await repo.getWishlistById('w2')).toEqual(w);
  });

  test('updateWishlist returns updated or null', async () => {
    const w = { _id: 'w3' } as any;
    jest.spyOn(WishlistModel, 'findByIdAndUpdate' as any).mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(w) } as any);
    expect(await repo.updateWishlist('w3', {} as any)).toEqual(w);
    jest.spyOn(WishlistModel, 'findByIdAndUpdate' as any).mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(null) } as any);
    expect(await repo.updateWishlist('none', {} as any)).toBeNull();
  });
});