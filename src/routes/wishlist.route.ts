import { Router } from "express";
import { WishlistController } from "../controllers/wishlist.controller";
import { authorizedMiddleware } from "../middlewares/authorization.middleware";

let wishlistController = new WishlistController();
const router = Router();

router.use(authorizedMiddleware);

router.post('/', wishlistController.createWishlist);
router.get('/', wishlistController.getAllWishlists);
router.get('/my', wishlistController.getMyWishlists);
router.get('/donor/:donorId', wishlistController.getWishlistsByDonorId);
router.get('/:id', wishlistController.getWishlistById);
router.put('/:id', wishlistController.updateWishlist);
router.delete('/:id', wishlistController.deleteWishlist);

export default router;
