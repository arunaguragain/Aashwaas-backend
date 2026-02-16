import { Router } from "express";
import { ReviewController } from "../controllers/review.controller";
import { authorizedMiddleware } from "../middlewares/authorization.middleware";

let reviewController = new ReviewController();

const router = Router();

router.use(authorizedMiddleware);

router.post('/', reviewController.createReview);
router.get('/', reviewController.getAllReviews);
router.get('/my', reviewController.getMyReviews);
router.get('/:id', reviewController.getReviewById);
router.put('/:id', reviewController.updateReview);
router.delete('/:id', reviewController.deleteReview);

export default router;
