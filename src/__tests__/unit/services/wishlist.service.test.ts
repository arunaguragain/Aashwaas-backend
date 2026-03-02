import { WishlistService } from "../../../services/wishlist.service";
import { WishlistRepository } from "../../../repositories/wishlist.repository";
import { HttpError } from "../../../errors/http-error";

describe("WishlistService", () => {
  let svc: WishlistService;
  beforeEach(() => {
    jest.restoreAllMocks();
    svc = new WishlistService();
  });

  describe("createWishlist", () => {
    test("throws when donorId missing", async () => {
      await expect(svc.createWishlist({ name: "x" } as any, "" as any)).rejects.toThrow("Donor ID is required");
    });

    test("sets defaults and calls repository", async () => {
      const fake = { _id: "w1" } as any;
      jest.spyOn(WishlistRepository.prototype, "createWishlist").mockResolvedValue(fake);
      const out = await svc.createWishlist({ title: "t" } as any, "d1");
      expect(out).toBe(fake);
      // status default is active
      expect(WishlistRepository.prototype.createWishlist).toHaveBeenCalledWith(expect.objectContaining({ status: "active", donorId: "d1" }));
    });
  });

  describe("getAllWishlists", () => {
    test("uses defaults when page/size missing", async () => {
      const result = { wishlists: [], total: 0 } as any;
      jest.spyOn(WishlistRepository.prototype, "getAllWishlists").mockResolvedValue(result);
      const out = await svc.getAllWishlists();
      expect(out.pagination.page).toBe(1);
      expect(out.pagination.size).toBe(10);
    });

    test("parses page/size from strings", async () => {
      const result = { wishlists: [], total: 20 } as any;
      jest.spyOn(WishlistRepository.prototype, "getAllWishlists").mockResolvedValue(result);
      const out = await svc.getAllWishlists("2", "5");
      expect(out.pagination.page).toBe(2);
      expect(out.pagination.size).toBe(5);
      expect(out.pagination.totalPages).toBe(Math.ceil(20 / 5));
    });
  });

  describe("getWishlistById", () => {
    test("throws when id missing", async () => {
      await expect(svc.getWishlistById("")).rejects.toThrow("Wishlist ID is required");
    });

    test("throws when not found", async () => {
      jest.spyOn(WishlistRepository.prototype, "getWishlistById").mockResolvedValue(null as any);
      await expect(svc.getWishlistById("w1")).rejects.toThrow("Wishlist not found");
    });

    test("returns when found", async () => {
      const w = { _id: "w1" } as any;
      jest.spyOn(WishlistRepository.prototype, "getWishlistById").mockResolvedValue(w);
      const out = await svc.getWishlistById("w1");
      expect(out).toBe(w);
    });
  });

  describe("getWishlistsByDonorId", () => {
    test("throws when donorId missing", async () => {
      await expect(svc.getWishlistsByDonorId("" as any)).rejects.toThrow("Donor ID is required");
    });

    test("returns pagination data", async () => {
      const result = { wishlists: [], total: 11 } as any;
      jest.spyOn(WishlistRepository.prototype, "getWishlistsByDonorId").mockResolvedValue(result);
      const out = await svc.getWishlistsByDonorId("d1", "1", "10");
      expect(out.pagination.totalPages).toBe(Math.ceil(11 / 10));
    });
  });

  describe("updateWishlist", () => {
    test("throws when id missing", async () => {
      await expect(svc.updateWishlist("", {} as any)).rejects.toThrow("Wishlist ID is required");
    });

    test("throws when not found", async () => {
      jest.spyOn(WishlistRepository.prototype, "getWishlistById").mockResolvedValue(null as any);
      await expect(svc.updateWishlist("w1", {} as any)).rejects.toThrow("Wishlist not found");
    });

    test("updates when found", async () => {
      jest.spyOn(WishlistRepository.prototype, "getWishlistById").mockResolvedValue({ _id: "w1" } as any);
      const upd = { _id: "w1" } as any;
      jest.spyOn(WishlistRepository.prototype, "updateWishlist").mockResolvedValue(upd);
      const out = await svc.updateWishlist("w1", { status: "inactive" } as any);
      expect(out).toBe(upd);
    });
  });

  describe("deleteWishlist", () => {
    test("throws when id missing", async () => {
      await expect(svc.deleteWishlist("")).rejects.toThrow("Wishlist ID is required");
    });

    test("throws when not found", async () => {
      jest.spyOn(WishlistRepository.prototype, "getWishlistById").mockResolvedValue(null as any);
      await expect(svc.deleteWishlist("w1")).rejects.toThrow("Wishlist not found");
    });

    test("deletes when found", async () => {
      jest.spyOn(WishlistRepository.prototype, "getWishlistById").mockResolvedValue({ _id: "w1" } as any);
      jest.spyOn(WishlistRepository.prototype, "deleteWishlist").mockResolvedValue(true as any);
      const out = await svc.deleteWishlist("w1");
      expect(out).toBe(true);
    });
  });
});
