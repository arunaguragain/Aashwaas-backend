import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authorizedMiddleware } from "../middlewares/authorization.middleware";
import { uploads } from "../middlewares/upload.middleware";

let authController = new AuthController();
const router = Router();

router.post("/register", authController.register)
router.post("/login", authController.login)
router.put("/:id", authorizedMiddleware, uploads.single("image"), authController.updateProfile)

router.post("/request-password-reset", 
    authController.sendResetPasswordEmail);
router.post("/reset-password/:token", authController.resetPassword);

router.get("/whoami", authorizedMiddleware, authController.whoami)
router.get(":id", authorizedMiddleware, authController.getUserById)

export default router;