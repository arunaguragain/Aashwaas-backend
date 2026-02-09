import { Router } from "express";
import { DonationController } from "../controllers/donation.controller";
import { authorizedMiddleware } from "../middlewares/authorization.middleware";
import { uploads } from "../middlewares/upload.middleware";

let donationController = new DonationController();

const router = Router();

router.use(authorizedMiddleware); 

router.post("/upload-photo", uploads.single("donationPhoto"), donationController.uploadPhoto);
router.post("/", uploads.fields([
	{ name: "image", maxCount: 1 },
	{ name: "donationPhoto", maxCount: 1 },
]), donationController.createDonation);
router.get("/", donationController.getAllDonations);
router.get("/my", donationController.getMyDonations); 
router.get("/donor/:donorId", donationController.getDonationsByDonorId);
router.get("/:id", donationController.getDonationById);
router.put("/:id", uploads.fields([
	{ name: "image", maxCount: 1 },
	{ name: "donationPhoto", maxCount: 1 },
]), donationController.updateDonation);
router.delete("/:id", donationController.deleteDonation);

export default router;
