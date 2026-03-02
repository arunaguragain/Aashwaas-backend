import { ReviewService } from "../../../services/review.service";
import { ReviewRepository } from "../../../repositories/review.repository";
import { HttpError } from "../../../errors/http-error";

describe("ReviewService", () => {
  let svc: ReviewService;
  beforeEach(() => {
    jest.restoreAllMocks();
    svc = new ReviewService();
  });

  describe("createReview", () => {
    test("throws when userId missing", async () => {
      await expect(svc.createReview({ title: "t" } as any, undefined as any)).rejects.toThrow("User ID is required");
    });

    test("creates review when userId provided", async () => {
      jest.spyOn(ReviewRepository.prototype, "createReview").mockResolvedValue({ _id: "r1" } as any);
      const out = await svc.createReview({ title: "t" } as any, "u1");
      expect(out).toHaveProperty("_id", "r1");
    });
  });

  describe("getReviewById", () => {
    test("throws when id missing", async () => {
      await expect(svc.getReviewById("")).rejects.toThrow("Review ID is required");
    });

    test("throws when review not found", async () => {
      jest.spyOn(ReviewRepository.prototype, "getReviewById").mockResolvedValue(null);
      await expect(svc.getReviewById("r1")).rejects.toThrow("Review not found");
    });

    test("returns review when found", async () => {
      jest.spyOn(ReviewRepository.prototype, "getReviewById").mockResolvedValue({ _id: "r1" } as any);
      const out = await svc.getReviewById("r1");
      expect(out).toHaveProperty("_id", "r1");
    });
  });

  describe("getAllReviews", () => {
    test("uses default pagination when no page/size provided", async () => {
      jest.spyOn(ReviewRepository.prototype, "getAllReviews").mockResolvedValue({ reviews: [], total: 0 } as any);
      const out = await svc.getAllReviews();
      expect(out.pagination).toEqual({ page: 1, size: 10, totalItems: 0, totalPages: 0 });
    });

    test("parses numeric page and size strings", async () => {
      jest.spyOn(ReviewRepository.prototype, "getAllReviews").mockResolvedValue({ reviews: [], total: 25 } as any);
      const out = await svc.getAllReviews("2", "10");
      expect(out.pagination).toHaveProperty("page", 2);
      expect(out.pagination).toHaveProperty("totalPages", 3);
    });
  });

  describe("getReviewsByUserId", () => {
    test("throws when userId missing", async () => {
      await expect(svc.getReviewsByUserId(undefined as any)).rejects.toThrow("User ID is required");
    });

    test("returns reviews and pagination", async () => {
      jest.spyOn(ReviewRepository.prototype, "getReviewsByUserId").mockResolvedValue({ reviews: [{ _id: "r1" }], total: 1 } as any);
      const out = await svc.getReviewsByUserId("u1", "1", "10");
      expect(out.reviews).toHaveLength(1);
      expect(out.pagination).toHaveProperty("page", 1);
    });
  });

  describe("updateReview", () => {
    test("throws when id missing", async () => {
      await expect(svc.updateReview("", { text: "x" } as any)).rejects.toThrow("Review ID is required");
    });

    test("updates when no userId provided", async () => {
      const review = { _id: "rX", userId: "owner" } as any;
      jest.spyOn(ReviewRepository.prototype, "getReviewById").mockResolvedValue(review);
      jest.spyOn(ReviewRepository.prototype, "updateReview").mockResolvedValue({ _id: "rX", text: "x" } as any);
      const out = await svc.updateReview("rX", { text: "x" } as any);
      expect(out).toHaveProperty("text", "x");
    });

    test("throws when review has no owner and userId provided", async () => {
      const review: any = { _id: "rY" }; // userId undefined
      jest.spyOn(ReviewRepository.prototype, "getReviewById").mockResolvedValue(review);
      await expect(svc.updateReview("rY", { text: "x" } as any, "u1")).rejects.toThrow("Not authorized to update this review");
    });

    test("throws when review owner toString throws and userId provided", async () => {
      const review: any = { _id: "rZ", userId: { toString: () => { throw new Error("oops"); } } };
      jest.spyOn(ReviewRepository.prototype, "getReviewById").mockResolvedValue(review);
      await expect(svc.updateReview("rZ", { text: "x" } as any, "u1")).rejects.toThrow("Not authorized to update this review");
    });

    test("throws when userId provided but not owner", async () => {
      const review = { _id: "r1", userId: "other" } as any;
      jest.spyOn(ReviewRepository.prototype, "getReviewById").mockResolvedValue(review);
      await expect(svc.updateReview("r1", { text: "x" } as any, "u1")).rejects.toThrow("Not authorized to update this review");
    });

    test("throws when review not found", async () => {
      jest.spyOn(ReviewRepository.prototype, "getReviewById").mockResolvedValue(null);
      await expect(svc.updateReview("r1", { text: "x" } as any)).rejects.toThrow("Review not found");
    });

    test("throws when userId provided but not owner", async () => {
      const review = { _id: "r1", userId: "other" } as any;
      jest.spyOn(ReviewRepository.prototype, "getReviewById").mockResolvedValue(review);
      await expect(svc.updateReview("r1", { text: "x" } as any, "u1")).rejects.toThrow("Not authorized to update this review");
    });

    test("updates when owner matches", async () => {
      const review = { _id: "r1", userId: "u1" } as any;
      jest.spyOn(ReviewRepository.prototype, "getReviewById").mockResolvedValue(review);
      jest.spyOn(ReviewRepository.prototype, "updateReview").mockResolvedValue({ _id: "r1", text: "x" } as any);
      const out = await svc.updateReview("r1", { text: "x" } as any, "u1");
      expect(out).toHaveProperty("text", "x");
    });

    test('allows owner check when review.userId is populated object with _id', async () => {
      const review = { _id: 'r2', userId: { _id: { toString: () => 'u2' } } } as any;
      jest.spyOn(ReviewRepository.prototype, 'getReviewById').mockResolvedValue(review);
      jest.spyOn(ReviewRepository.prototype, 'updateReview').mockResolvedValue({ _id: 'r2' } as any);
      const out = await svc.updateReview('r2', { text: 'x' } as any, 'u2');
      expect(out).toHaveProperty('_id', 'r2');
    });

    test('allows owner check when review.userId has id property', async () => {
      const review = { _id: 'r3', userId: { id: { toString: () => 'u3' } } } as any;
      jest.spyOn(ReviewRepository.prototype, 'getReviewById').mockResolvedValue(review);
      jest.spyOn(ReviewRepository.prototype, 'updateReview').mockResolvedValue({ _id: 'r3' } as any);
      const out = await svc.updateReview('r3', { text: 'x' } as any, 'u3');
      expect(out).toHaveProperty('_id', 'r3');
    });

    test('allows owner check when review.userId.toString exists', async () => {
      const review = { _id: 'r4', userId: { toString: () => 'u4' } } as any;
      jest.spyOn(ReviewRepository.prototype, 'getReviewById').mockResolvedValue(review);
      jest.spyOn(ReviewRepository.prototype, 'updateReview').mockResolvedValue({ _id: 'r4' } as any);
      const out = await svc.updateReview('r4', { text: 'x' } as any, 'u4');
      expect(out).toHaveProperty('_id', 'r4');
    });
  });

  describe("deleteReview", () => {
    test("throws when id missing", async () => {
      await expect(svc.deleteReview("")).rejects.toThrow("Review ID is required");
    });

    test("throws when not found", async () => {
      jest.spyOn(ReviewRepository.prototype, "getReviewById").mockResolvedValue(null);
      await expect(svc.deleteReview("r1")).rejects.toThrow("Review not found");
    });

    test("deletes when no userId provided", async () => {
      jest.spyOn(ReviewRepository.prototype, "getReviewById").mockResolvedValue({ _id: "rA", userId: "uA" } as any);
      jest.spyOn(ReviewRepository.prototype, "deleteReview").mockResolvedValue(true as any);
      const out = await svc.deleteReview("rA");
      expect(out).toBeTruthy();
    });

    test("throws when review has no owner and userId provided", async () => {
      jest.spyOn(ReviewRepository.prototype, "getReviewById").mockResolvedValue({ _id: "rB" } as any);
      await expect(svc.deleteReview("rB", "u1")).rejects.toThrow("Not authorized to delete this review");
    });

    test("throws when userId provided but not owner", async () => {
      jest.spyOn(ReviewRepository.prototype, "getReviewById").mockResolvedValue({ _id: "r1", userId: "other" } as any);
      await expect(svc.deleteReview("r1", "u1")).rejects.toThrow("Not authorized to delete this review");
    });

    test("deletes when owner matches", async () => {
      jest.spyOn(ReviewRepository.prototype, "getReviewById").mockResolvedValue({ _id: "r1", userId: "u1" } as any);
      jest.spyOn(ReviewRepository.prototype, "deleteReview").mockResolvedValue(true as any);
      const out = await svc.deleteReview("r1", "u1");
      expect(out).toBeTruthy();
    });

    test('deletes when owner matches with populated _id object', async () => {
      jest.spyOn(ReviewRepository.prototype, 'getReviewById').mockResolvedValue({ _id: 'r5', userId: { _id: { toString: () => 'u5' } } } as any);
      jest.spyOn(ReviewRepository.prototype, 'deleteReview').mockResolvedValue(true as any);
      const out = await svc.deleteReview('r5', 'u5');
      expect(out).toBeTruthy();
    });

    test('deletes when owner matches with id property', async () => {
      jest.spyOn(ReviewRepository.prototype, 'getReviewById').mockResolvedValue({ _id: 'r6', userId: { id: { toString: () => 'u6' } } } as any);
      jest.spyOn(ReviewRepository.prototype, 'deleteReview').mockResolvedValue(true as any);
      const out = await svc.deleteReview('r6', 'u6');
      expect(out).toBeTruthy();
    });

    test('deletes when owner matches with plain object toString', async () => {
      jest.spyOn(ReviewRepository.prototype, 'getReviewById').mockResolvedValue({ _id: 'r7', userId: { toString: () => 'u7' } } as any);
      jest.spyOn(ReviewRepository.prototype, 'deleteReview').mockResolvedValue(true as any);
      const out = await svc.deleteReview('r7', 'u7');
      expect(out).toBeTruthy();
    });

    test('throws when userId.toString throws inside deleteReview', async () => {
      jest.spyOn(ReviewRepository.prototype, 'getReviewById').mockResolvedValue({ _id: 'rZ', userId: { toString: () => { throw new Error('oops'); } } } as any);
      await expect(svc.deleteReview('rZ', 'u1')).rejects.toThrow('Not authorized to delete this review');
    });

    test('throws when toString throws and userId provided', async () => {
      jest.spyOn(ReviewRepository.prototype, 'getReviewById').mockResolvedValue({ _id: 'r8', userId: { toString: () => { throw new Error('bad'); } } } as any);
      await expect(svc.deleteReview('r8', 'u8')).rejects.toThrow('Not authorized to delete this review');
    });
  });

  test("ReviewService - basic errors and owner checks", async () => {
    const service = new ReviewService();
    await expect(service.createReview({}, '' as any)).rejects.toThrow();

    jest.spyOn(ReviewRepository.prototype, 'getReviewById').mockResolvedValue(null as any);
    await expect(service.getReviewById('nope')).rejects.toThrow();

    const mockReview: any = { userId: 'owner' };
    jest.spyOn(ReviewRepository.prototype, 'getReviewById').mockResolvedValue(mockReview);
    await expect(service.updateReview('id', {}, 'other')).rejects.toThrow();

    jest.spyOn(ReviewRepository.prototype, 'getReviewById').mockResolvedValue(mockReview);
    await expect(service.deleteReview('id', 'other')).rejects.toThrow();
  });

});
