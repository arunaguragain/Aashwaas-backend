import { Router } from "express";
import { NgoController } from "../controllers/ngo.controller";
import { authorizedMiddleware } from "../middlewares/authorization.middleware";

let ngoController = new NgoController();

const router = Router();

router.use(authorizedMiddleware);

router.get("/", ngoController.getAllNgos);
router.get("/:id", ngoController.getNgoById);

export default router;
