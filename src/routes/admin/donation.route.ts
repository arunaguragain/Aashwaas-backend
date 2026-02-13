import { Router } from "express";
import { AdminDonationController } from "../../controllers/admin/donation.controller";
import { adminMiddleware, authorizedMiddleware } from "../../middlewares/authorization.middleware";

let adminDonationController = new AdminDonationController();

const router = Router();

router.use(authorizedMiddleware);
router.use(adminMiddleware);


// Get all donations (with optional pagination)
router.get("/", adminDonationController.getAllDonations);

// Get donation by ID
router.get("/:id", adminDonationController.getDonationById);

// Delete donation by ID
router.delete("/:id", adminDonationController.deleteDonation);

router.put("/:id/approve", adminDonationController.approveDonation);
router.post("/:id/assign", adminDonationController.assignDonation);

export default router;
