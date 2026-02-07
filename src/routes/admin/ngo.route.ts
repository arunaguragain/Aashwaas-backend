import { Router } from "express";
import { AdminNgoController } from "../../controllers/admin/ngo.controller";
import { adminMiddleware, authorizedMiddleware } from "../../middlewares/authorization.middleware";
import { uploads } from "../../middlewares/upload.middleware";

let adminNgoController = new AdminNgoController();

const router = Router();

router.use(authorizedMiddleware);
router.use(adminMiddleware);

router.post("/", uploads.array("photos", 5), adminNgoController.createNgo);
router.get("/", adminNgoController.getAllNgos);
router.get("/:id", adminNgoController.getNgoById);
router.put("/:id", uploads.array("photos", 5), adminNgoController.updateNgo);
router.delete("/:id", adminNgoController.deleteNgo);

export default router;
