import { ReviewController } from "../../../controllers/review.controller";
import { ReviewService } from "../../../services/review.service";
import { HttpError } from "../../../errors/http-error";

const mockRes = () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  return { status, json } as any;
};

describe("ReviewController", () => {
  let ctrl: ReviewController;
  beforeEach(() => {
    jest.restoreAllMocks();
    ctrl = new ReviewController();
  });

  describe("createReview", () => {
    test("returns 400 on validation failure", async () => {
      const req: any = { body: {} };
      const res = mockRes();
      await ctrl.createReview(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("returns 401 when unauthenticated", async () => {
      const req: any = { body: { title: "t", donationId: "d1", rating: 5 }, user: undefined };
      const res = mockRes();
      await ctrl.createReview(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test("returns 201 on success", async () => {
      const req: any = { body: { title: "t", donationId: "d1", rating: 5 }, user: { _id: "u1" } };
      const res = mockRes();
      jest.spyOn(ReviewService.prototype, "createReview").mockResolvedValue({ _id: "r1" } as any);
      await ctrl.createReview(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test("returns service error status when service throws HttpError", async () => {
      const req: any = { body: { title: "t", donationId: "d1", rating: 5 }, user: { _id: "u1" } };
      const res = mockRes();
      jest.spyOn(ReviewService.prototype, "createReview").mockRejectedValue(new HttpError(418, "teapot"));
      await ctrl.createReview(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(418);
    });

    test('returns 500 when createReview throws generic error', async () => {
      const req: any = { body: { title: "t", donationId: "d1", rating: 5 }, user: { _id: "u1" } };
      const res = mockRes();
      jest.spyOn(ReviewService.prototype, "createReview").mockRejectedValueOnce({});
      await ctrl.createReview(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("deleteReview", () => {
    test("returns 404 when delete returns falsy", async () => {
      const req: any = { params: { id: "r1" }, user: { _id: "u1" } };
      const res = mockRes();
      jest.spyOn(ReviewService.prototype, "deleteReview").mockResolvedValue(false as any);
      await ctrl.deleteReview(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("returns 200 on successful delete", async () => {
      const req: any = { params: { id: "r1" }, user: { _id: "u1" } };
      const res = mockRes();
      jest.spyOn(ReviewService.prototype, "deleteReview").mockResolvedValue(true as any);
      await ctrl.deleteReview(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  test("ReviewController.createReview - validation failure and unauthenticated", async () => {
      const ctrl = new ReviewController();
      const reqInvalid: any = { body: {} };
      const res1 = mockRes();
      await ctrl.createReview(reqInvalid, res1, jest.fn());
      expect(res1.status).toHaveBeenCalledWith(400);
  
      const reqNoUser: any = { body: { rating: 5 } };
      const res2 = mockRes();
      await ctrl.createReview(reqNoUser, res2, jest.fn());
      expect(res2.status).toHaveBeenCalledWith(401);
    });
  
    test("ReviewController.getMyReviews - unauthenticated", async () => {
      const ctrl = new ReviewController();
      const req: any = { query: {} };
      const res = mockRes();
      await ctrl.getMyReviews(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(401);
    });
  
    test("ReviewController.updateReview - validation failure", async () => {
      const ctrl = new ReviewController();
      const req: any = { params: { id: '1' }, body: { rating: 'bad' } };
      const res = mockRes();
      await ctrl.updateReview(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
    });
  
    test("ReviewController.deleteReview - not found and success", async () => {
      const ctrl = new ReviewController();
      jest.spyOn(ReviewService.prototype, 'deleteReview').mockResolvedValue(false as any);
      const req1: any = { params: { id: 'r1' }, user: { _id: { toString: () => 'u1' } } };
      const res1 = mockRes();
      await ctrl.deleteReview(req1, res1, jest.fn());
      expect(res1.status).toHaveBeenCalledWith(404);
  
      jest.spyOn(ReviewService.prototype, 'deleteReview').mockResolvedValue(true as any);
      const res2 = mockRes();
      await ctrl.deleteReview(req1, res2, jest.fn());
      expect(res2.status).toHaveBeenCalledWith(200);
    });

  describe('getAllReviews / getReviewById / getMyReviews / updateReview', () => {
    test('getAllReviews returns 200 with data', async () => {
      const req: any = { query: {} };
      const res = mockRes();
      const reviews = [{ _id: 'r1' }];
      const pagination = { page: 1, size: 10, totalItems: 1, totalPages: 1 };
      jest.spyOn(ReviewService.prototype, 'getAllReviews').mockResolvedValueOnce({ reviews, pagination } as any);
      await ctrl.getAllReviews(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: reviews, pagination, message: 'All reviews retrieved' });
    });

    test('getAllReviews handles error', async () => {
      const req: any = { query: {} };
      const res = mockRes();
      jest.spyOn(ReviewService.prototype, 'getAllReviews').mockRejectedValueOnce(new Error('boom'));
      await ctrl.getAllReviews(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('getAllReviews falls back to default message when error has no message', async () => {
      const req: any = { query: {} };
      const res = mockRes();
      jest.spyOn(ReviewService.prototype, 'getAllReviews').mockRejectedValueOnce({});
      await ctrl.getAllReviews(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
    });

    test('getAllReviews propagates statusCode from error', async () => {
      const req: any = { query: {} };
      const res = mockRes();
      const err: any = { statusCode: 418, message: 'nope' };
      jest.spyOn(ReviewService.prototype, 'getAllReviews').mockRejectedValueOnce(err);
      await ctrl.getAllReviews(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(418);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'nope' });
    });

    test('getAllReviews statusCode-only error falls back to default message', async () => {
      const req: any = { query: {} };
      const res = mockRes();
      jest.spyOn(ReviewService.prototype, 'getAllReviews').mockRejectedValueOnce({ statusCode: 418 });
      await ctrl.getAllReviews(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(418);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
    });

    test('getReviewById returns 200 with review', async () => {
      const req: any = { params: { id: 'r1' } };
      const res = mockRes();
      const review = { _id: 'r1' } as any;
      jest.spyOn(ReviewService.prototype, 'getReviewById').mockResolvedValueOnce(review);
      await ctrl.getReviewById(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: review, message: 'Review retrieved' });
    });

    test('getReviewById handles error', async () => {
      const req: any = { params: { id: 'r1' } };
      const res = mockRes();
      jest.spyOn(ReviewService.prototype, 'getReviewById').mockRejectedValueOnce(new Error('nope'));
      await ctrl.getReviewById(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('getReviewById falls back to default message when error has no message', async () => {
      const req: any = { params: { id: 'r1' } };
      const res = mockRes();
      jest.spyOn(ReviewService.prototype, 'getReviewById').mockRejectedValueOnce({});
      await ctrl.getReviewById(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
    });

    test('getReviewById propagates statusCode error', async () => {
      const req: any = { params: { id: 'r1' } };
      const res = mockRes();
      const err: any = { statusCode: 422, message: 'bad' };
      jest.spyOn(ReviewService.prototype, 'getReviewById').mockRejectedValueOnce(err);
      await ctrl.getReviewById(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'bad' });
    });

    test('getMyReviews returns 401 when unauthenticated and 200 when authenticated', async () => {
      const res1 = mockRes();
      await ctrl.getMyReviews({} as any, res1, jest.fn() as any);
      expect(res1.status).toHaveBeenCalledWith(401);

      const reviews = [{ _id: 'r2' }];
      const pagination = { page: 1, size: 10, totalItems: 1, totalPages: 1 };
      jest.spyOn(ReviewService.prototype, 'getReviewsByUserId').mockResolvedValueOnce({ reviews, pagination } as any);
      const req2: any = { query: {}, user: { _id: 'u1' } };
      const res2 = mockRes();
      await ctrl.getMyReviews(req2, res2, jest.fn() as any);
      expect(res2.status).toHaveBeenCalledWith(200);
      expect(res2.json).toHaveBeenCalledWith({ success: true, data: reviews, pagination, message: 'Your reviews retrieved' });
    });

    test('getMyReviews falls back to default message when service throws without message', async () => {
      const req: any = { query: {}, user: { _id: 'u1' } };
      const res = mockRes();
      jest.spyOn(ReviewService.prototype, 'getReviewsByUserId').mockRejectedValueOnce({});
      await ctrl.getMyReviews(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
    });

    test('deleteReview handles service errors and generic failure', async () => {
      const req: any = { params: { id: 'r1' }, user: { _id: 'u1' } };
      const res = mockRes();
      jest.spyOn(ReviewService.prototype, 'deleteReview').mockRejectedValueOnce({ statusCode: 418, message: 'fail' });
      await ctrl.deleteReview(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(418);

      const res2 = mockRes();
      jest.spyOn(ReviewService.prototype, 'deleteReview').mockRejectedValueOnce({});
      await ctrl.deleteReview(req, res2, jest.fn() as any);
      expect(res2.status).toHaveBeenCalledWith(500);
    });

    test('getMyReviews propagates service error when authenticated', async () => {
      jest.spyOn(ReviewService.prototype, 'getReviewsByUserId').mockRejectedValueOnce(new Error('err'));
      const req: any = { query: {}, user: { _id: 'u1' } };
      const res = mockRes();
      await ctrl.getMyReviews(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('getMyReviews propagates statusCode error', async () => {
      const err: any = { statusCode: 401, message: 'no auth' };
      jest.spyOn(ReviewService.prototype, 'getReviewsByUserId').mockRejectedValueOnce(err);
      const req: any = { query: {}, user: { _id: 'u1' } };
      const res = mockRes();
      await ctrl.getMyReviews(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'no auth' });
    });

    test('updateReview returns 200 on success and propagates service errors', async () => {
      const updated = { _id: 'r3' } as any;
      jest.spyOn(ReviewService.prototype, 'updateReview').mockResolvedValueOnce(updated as any);
      const req2: any = { params: { id: 'r3' }, body: { title: 'ok', rating: 4 }, user: { _id: 'u1' } };
      const res2 = mockRes();
      await ctrl.updateReview(req2, res2, jest.fn() as any);
      expect(res2.status).toHaveBeenCalledWith(200);
      expect(res2.json).toHaveBeenCalledWith({ success: true, message: 'Review updated', data: updated });

      const err: any = new Error('boom');
      err.statusCode = 418;
      jest.spyOn(ReviewService.prototype, 'updateReview').mockRejectedValueOnce(err);
      const res3 = mockRes();
      await ctrl.updateReview(req2, res3, jest.fn() as any);
      expect(res3.status).toHaveBeenCalledWith(418);
    });

    test('updateReview catches generic service errors', async () => {
      jest.spyOn(ReviewService.prototype, 'updateReview').mockRejectedValueOnce({});
      const req: any = { params: { id: 'r3' }, body: { title: 'ok', rating: 4 }, user: { _id: 'u1' } };
      const res = mockRes();
      await ctrl.updateReview(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('updateReview propagates error message when provided', async () => {
      const msgErr: any = { message: 'oops' };
      jest.spyOn(ReviewService.prototype, 'updateReview').mockRejectedValueOnce(msgErr);
      const req: any = { params: { id: 'r4' }, body: { title: 'ok', rating: 4 }, user: { _id: 'u1' } };
      const res = mockRes();
      await ctrl.updateReview(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'oops' });
    });

    test('getAllReviews parses page/size query strings', async () => {
      const req: any = { query: { page: '2', size: '5' } };
      const res = mockRes();
      const reviews = [{ _id: 'rX' }];
      const pagination = { page: 2, size: 5, totalItems: 1, totalPages: 1 };
      jest.spyOn(ReviewService.prototype, 'getAllReviews').mockResolvedValueOnce({ reviews, pagination } as any);
      await ctrl.getAllReviews(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: reviews, pagination, message: 'All reviews retrieved' });
    });

    test('getAllReviews propagates custom error message', async () => {
      const req: any = { query: {} };
      const res = mockRes();
      jest.spyOn(ReviewService.prototype, 'getAllReviews').mockRejectedValueOnce({ message: 'fail' });
      await ctrl.getAllReviews(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'fail' });
    });


    test('updateReview returns 400 when validation fails', async () => {
      // mock schema to fail
      const dtoMod = require('../../../dtos/review.dto');
      jest.spyOn(dtoMod.UpdateReviewDTO, 'safeParse').mockReturnValue({ success: false, error: { message: 'bad' } } as any);
      const req: any = { params: { id: 'r3' }, body: { title: '' } };
      const res = mockRes();
      await ctrl.updateReview(req, res, jest.fn() as any);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
