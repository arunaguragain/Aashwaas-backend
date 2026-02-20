import { ReviewRepository } from '../../../repositories/review.repository';
import { ReviewModel } from '../../../models/review.model';

describe('ReviewRepository', () => {
  let repo: ReviewRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new ReviewRepository();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getReviewById', () => {
    test('returns null when not found', async () => {
      const populateMock = jest.fn().mockResolvedValueOnce(null);
      const findByIdSpy = jest.spyOn(ReviewModel, 'findById').mockReturnValueOnce({ populate: populateMock } as any);

      const result = await repo.getReviewById('nope');

      expect(findByIdSpy).toHaveBeenCalledWith('nope');
      expect(populateMock).toHaveBeenCalledWith('userId', 'name email');
      expect(result).toBeNull();
    });

    test('returns review when found', async () => {
      const review = { _id: 'r1', rating: 5, comment: 'Great', userId: 'u1' } as any;
      const populateMock = jest.fn().mockResolvedValueOnce(review);
      const findByIdSpy = jest.spyOn(ReviewModel, 'findById').mockReturnValueOnce({ populate: populateMock } as any);

      const result = await repo.getReviewById('r1');

      expect(findByIdSpy).toHaveBeenCalledWith('r1');
      expect(populateMock).toHaveBeenCalledWith('userId', 'name email');
      expect(result).toBe(review);
    });
  });

  describe('getAllReviews', () => {
    test('returns reviews and total with pagination', async () => {
      const reviews = [{ _id: 'r1' }, { _id: 'r2' }] as any[];

      const populateMock = jest.fn().mockResolvedValueOnce(reviews);
      const limitMock = jest.fn().mockReturnValueOnce({ populate: populateMock });
      const skipMock = jest.fn().mockReturnValueOnce({ limit: limitMock });

      const findSpy = jest.spyOn(ReviewModel, 'find').mockReturnValueOnce({ skip: skipMock } as any);
      const countSpy = jest.spyOn(ReviewModel, 'countDocuments').mockResolvedValueOnce(25 as any);

      const result = await repo.getAllReviews(2, 5);

      expect(findSpy).toHaveBeenCalledWith();
      expect(skipMock).toHaveBeenCalledWith((2 - 1) * 5);
      expect(limitMock).toHaveBeenCalledWith(5);
      expect(populateMock).toHaveBeenCalledWith('userId', 'name email');

      expect(countSpy).toHaveBeenCalledWith();
      expect(result.reviews).toBe(reviews);
      expect(result.total).toBe(25);
    });
  });

  describe('getReviewsByUserId', () => {
    test('returns filtered reviews and total', async () => {
      const reviews = [{ _id: 'r1' }] as any[];

      const populateMock = jest.fn().mockResolvedValueOnce(reviews);
      const limitMock = jest.fn().mockReturnValueOnce({ populate: populateMock });
      const skipMock = jest.fn().mockReturnValueOnce({ limit: limitMock });

      const filter = { userId: 'user1' } as any;
      const findSpy = jest.spyOn(ReviewModel, 'find').mockReturnValueOnce({ skip: skipMock } as any);
      const countSpy = jest.spyOn(ReviewModel, 'countDocuments').mockResolvedValueOnce(7 as any);

      const result = await repo.getReviewsByUserId('user1', 1, 5);

      expect(findSpy).toHaveBeenCalledWith(filter);
      expect(skipMock).toHaveBeenCalledWith(0);
      expect(limitMock).toHaveBeenCalledWith(5);
      expect(populateMock).toHaveBeenCalledWith('userId', 'name email');

      expect(countSpy).toHaveBeenCalledWith(filter);
      expect(result.reviews).toBe(reviews);
      expect(result.total).toBe(7);
    });
  });

  describe('createReview', () => {
    test('saves and returns created review', async () => {
      const input = { rating: 4, comment: 'Nice', userId: 'u1' } as any;
      const saved = { _id: 's1', ...input } as any;

      const saveSpy = jest.spyOn(ReviewModel.prototype, 'save').mockResolvedValueOnce(saved);

      const result = await repo.createReview(input);

      expect(saveSpy).toHaveBeenCalled();
      expect(result).toBe(saved);
    });
  });

  describe('updateReview', () => {
    test('returns updated review when found', async () => {
      const updated = { _id: 'r1', rating: 5 } as any;
      const populateMock = jest.fn().mockResolvedValueOnce(updated);
      const updateSpy = jest.spyOn(ReviewModel, 'findByIdAndUpdate').mockReturnValueOnce({ populate: populateMock } as any);

      const result = await repo.updateReview('r1', { rating: 5 } as any);

      expect(updateSpy).toHaveBeenCalledWith('r1', { rating: 5 }, { new: true });
      expect(populateMock).toHaveBeenCalledWith('userId', 'name email');
      expect(result).toBe(updated);
    });

    test('returns null when not found', async () => {
      const populateMock = jest.fn().mockResolvedValueOnce(null);
      jest.spyOn(ReviewModel, 'findByIdAndUpdate').mockReturnValueOnce({ populate: populateMock } as any);

      const result = await repo.updateReview('no', { rating: 3 } as any);

      expect(populateMock).toHaveBeenCalledWith('userId', 'name email');
      expect(result).toBeNull();
    });
  });

  describe('deleteReview', () => {
    test('returns true when deleted', async () => {
      const deleted = { _id: 'r1' } as any;
      const deleteSpy = jest.spyOn(ReviewModel, 'findByIdAndDelete').mockResolvedValueOnce(deleted as any);

      const result = await repo.deleteReview('r1');

      expect(deleteSpy).toHaveBeenCalledWith('r1');
      expect(result).toBe(true);
    });

    test('returns false when not found', async () => {
      jest.spyOn(ReviewModel, 'findByIdAndDelete').mockResolvedValueOnce(null as any);

      const result = await repo.deleteReview('nope');

      expect(result).toBe(false);
    });
  });
});