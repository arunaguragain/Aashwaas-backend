import { WishlistController } from "../../../controllers/wishlist.controller";
import { WishlistService } from "../../../services/wishlist.service";
import { HttpError } from "../../../errors/http-error";

const mockRes = () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  return { status, json } as any;
};

describe("WishlistController", () => {
  let ctrl: WishlistController;
  beforeEach(() => {
    jest.restoreAllMocks();
    ctrl = new WishlistController();
  });

  describe("createWishlist", () => {
    test("returns 400 on validation failure", async () => {
      const req: any = { body: {} };
      const res = mockRes();
      await ctrl.createWishlist(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("returns 401 when unauthenticated", async () => {
      const req: any = { body: { title: "Test", category: "Food", plannedDate: "2026-03-01" }, user: undefined };
      const res = mockRes();
      await ctrl.createWishlist(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test("returns 201 on success", async () => {
      const req: any = { body: { title: "Test", category: "Food", plannedDate: "2026-03-01" }, user: { _id: "u1" } };
      const res = mockRes();
      jest.spyOn(WishlistService.prototype, "createWishlist").mockResolvedValue({ _id: "w1" } as any);
      await ctrl.createWishlist(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test("returns service error status when service throws HttpError", async () => {
      const req: any = { body: { title: "Test", category: "Food", plannedDate: "2026-03-01" }, user: { _id: "u1" } };
      const res = mockRes();
      jest.spyOn(WishlistService.prototype, "createWishlist").mockRejectedValue(new HttpError(422, "bad"));
      await ctrl.createWishlist(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(422);
    });
  });

  describe("deleteWishlist", () => {
    test("returns 404 when delete returns falsy", async () => {
      const req: any = { params: { id: "w1" } };
      const res = mockRes();
      jest.spyOn(WishlistService.prototype, "deleteWishlist").mockResolvedValue(false as any);
      await ctrl.deleteWishlist(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("returns 200 on successful delete", async () => {
      const req: any = { params: { id: "w1" } };
      const res = mockRes();
      jest.spyOn(WishlistService.prototype, "deleteWishlist").mockResolvedValue(true as any);
      await ctrl.deleteWishlist(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getAll/getById/getByDonor/getMy/update', () => {
    test('getAllWishlists returns 200 with data', async () => {
      const req: any = { query: {} };
      const res = mockRes();
      const wishlists = [{ _id: 'w1' }];
      const pagination = { page: 1, size: 10, totalItems: 1, totalPages: 1 };
      jest.spyOn(WishlistService.prototype, 'getAllWishlists').mockResolvedValueOnce({ wishlists, pagination } as any);
      await ctrl.getAllWishlists(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: wishlists, pagination, message: 'All wishlists retrieved' });
    });

    test('getAllWishlists handles errors (default message)', async () => {
      const req: any = { query: {} };
      const res = mockRes();
      jest.spyOn(WishlistService.prototype, 'getAllWishlists').mockRejectedValueOnce({});
      await ctrl.getAllWishlists(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
    });

    test('getAllWishlists parses page/size query strings', async () => {
      const req: any = { query: { page: '3', size: '7' } };
      const res = mockRes();
      const wishlists = [{ _id: 'wX' }];
      const pagination = { page: 3, size: 7, totalItems: 1, totalPages: 1 };
      jest.spyOn(WishlistService.prototype, 'getAllWishlists').mockResolvedValueOnce({ wishlists, pagination } as any);
      await ctrl.getAllWishlists(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: wishlists, pagination, message: 'All wishlists retrieved' });
    });

    test('getAllWishlists propagates custom error message', async () => {
      const req: any = { query: {} };
      const res = mockRes();
      jest.spyOn(WishlistService.prototype, 'getAllWishlists').mockRejectedValueOnce({ message: 'boom' });
      await ctrl.getAllWishlists(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'boom' });
    });

    test('getWishlistById returns 200 with wishlist', async () => {
      const req: any = { params: { id: 'w1' } };
      const res = mockRes();
      const wishlist = { _id: 'w1' } as any;
      jest.spyOn(WishlistService.prototype, 'getWishlistById').mockResolvedValueOnce(wishlist);
      await ctrl.getWishlistById(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: wishlist, message: 'Wishlist retrieved successfully' });
    });

    test('getWishlistById handles error (default message)', async () => {
      const req: any = { params: { id: 'w1' } };
      const res = mockRes();
      jest.spyOn(WishlistService.prototype, 'getWishlistById').mockRejectedValueOnce({});
      await ctrl.getWishlistById(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
    });

    test('getWishlistById propagates message-only error', async () => {
      const req: any = { params: { id: 'w1' } };
      const res = mockRes();
      jest.spyOn(WishlistService.prototype, 'getWishlistById').mockRejectedValueOnce({ message: 'nope' });
      await ctrl.getWishlistById(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'nope' });
    });

    test('getWishlistsByDonorId handles error', async () => {
      const req: any = { params: { donorId: 'u1' }, query: {} };
      const res = mockRes();
      jest.spyOn(WishlistService.prototype, 'getWishlistsByDonorId').mockRejectedValueOnce({});
      await ctrl.getWishlistsByDonorId(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('getWishlistsByDonorId returns data', async () => {
      const req: any = { params: { donorId: 'u1' }, query: {} };
      const res = mockRes();
      const wishlists = [{ _id: 'w2' }];
      const pagination = { page: 1, size: 10, totalItems: 1, totalPages: 1 };
      jest.spyOn(WishlistService.prototype, 'getWishlistsByDonorId').mockResolvedValueOnce({ wishlists, pagination } as any);
      await ctrl.getWishlistsByDonorId(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: wishlists, pagination, message: 'Donor wishlists retrieved' });
    });

    test('getWishlistsByDonorId handles error', async () => {
      const req: any = { params: { donorId: 'u1' }, query: {} };
      const res = mockRes();
      jest.spyOn(WishlistService.prototype, 'getWishlistsByDonorId').mockRejectedValueOnce({});
      await ctrl.getWishlistsByDonorId(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('getMyWishlists returns 401 when unauthenticated and 200 when authenticated', async () => {
      const res1 = mockRes();
      await ctrl.getMyWishlists({} as any, res1, jest.fn() as any);
      expect(res1.status).toHaveBeenCalledWith(401);

      const wishlists = [{ _id: 'w3' }];
      const pagination = { page: 1, size: 10, totalItems: 1, totalPages: 1 };
      jest.spyOn(WishlistService.prototype, 'getWishlistsByDonorId').mockResolvedValueOnce({ wishlists, pagination } as any);
      const req2: any = { query: {}, user: { _id: 'u1' } };
      const res2 = mockRes();
      await ctrl.getMyWishlists(req2, res2, jest.fn() as any);
      expect(res2.status).toHaveBeenCalledWith(200);
      expect(res2.json).toHaveBeenCalledWith({ success: true, data: wishlists, pagination, message: 'Your wishlists retrieved' });
    });

    test('getMyWishlists handles generic service error (default msg)', async () => {
      const req: any = { query: {}, user: { _id: 'u1' } };
      const res = mockRes();
      jest.spyOn(WishlistService.prototype, 'getWishlistsByDonorId').mockRejectedValueOnce({});
      await ctrl.getMyWishlists(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
    });

    test('updateWishlist returns 200 on success and propagates service errors', async () => {
      const updated = { _id: 'w4' } as any;
      jest.spyOn(WishlistService.prototype, 'updateWishlist').mockResolvedValueOnce(updated as any);
      const req2: any = { params: { id: 'w4' }, body: { title: 'ok' } };
      const res2 = mockRes();
      await ctrl.updateWishlist(req2, res2, jest.fn() as any);
      expect(res2.status).toHaveBeenCalledWith(200);
      expect(res2.json).toHaveBeenCalledWith({ success: true, message: 'Wishlist updated successfully', data: updated });

      const err: any = new Error('boom');
      err.statusCode = 418;
      jest.spyOn(WishlistService.prototype, 'updateWishlist').mockRejectedValueOnce(err);
      const res3 = mockRes();
      await ctrl.updateWishlist(req2, res3, jest.fn() as any);
      expect(res3.status).toHaveBeenCalledWith(418);
    });

    test('updateWishlist propagates message-only error', async () => {
      jest.spyOn(WishlistService.prototype, 'updateWishlist').mockRejectedValueOnce({ message: 'bad' });
      const req: any = { params: { id: 'w4' }, body: { title: 'ok' } };
      const res = mockRes();
      await ctrl.updateWishlist(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'bad' });
    });

    test('updateWishlist catches generic service error with default message', async () => {
      jest.spyOn(WishlistService.prototype, 'updateWishlist').mockRejectedValueOnce({});
      const req: any = { params: { id: 'w4' }, body: { title: 'ok' } };
      const res = mockRes();
      await ctrl.updateWishlist(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
    });

    test('updateWishlist returns 400 when validation fails', async () => {
      const req: any = { params: { id: 'w5' }, body: { title: '' } };
      const res = mockRes();
      await ctrl.updateWishlist(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  test('createWishlist generic error', async () => {
    const req: any = { body: { title: 'Test', category: 'Food', plannedDate: '2026-03-01' }, user: { _id: 'u1' } };
    const res = mockRes();
    jest.spyOn(WishlistService.prototype, 'createWishlist').mockRejectedValueOnce({});
    await ctrl.createWishlist(req, res, jest.fn() as any);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('createWishlist propagates message-only error', async () => {
    const req: any = { body: { title: 'Test', category: 'Food', plannedDate: '2026-03-01' }, user: { _id: 'u1' } };
    const res = mockRes();
    jest.spyOn(WishlistService.prototype, 'createWishlist').mockRejectedValueOnce({ message: 'oops' });
    await ctrl.createWishlist(req, res, jest.fn() as any);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'oops' });
  });


  test('deleteWishlist generic error', async () => {
    const req: any = { params: { id: 'w1' } };
    const res = mockRes();
    jest.spyOn(WishlistService.prototype, 'deleteWishlist').mockRejectedValueOnce({});
    await ctrl.deleteWishlist(req, res, jest.fn() as any);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('deleteWishlist propagates message-only error', async () => {
    const req: any = { params: { id: 'w1' } };
    const res = mockRes();
    jest.spyOn(WishlistService.prototype, 'deleteWishlist').mockRejectedValueOnce({ message: 'gone' });
    await ctrl.deleteWishlist(req, res, jest.fn() as any);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'gone' });
  });  });
});
