import { Router } from "express";
import { VolunteerTaskController } from "../../controllers/volunteer/task.controller";
import { authorizedMiddleware,  } from "../../middlewares/authorization.middleware";

let volunteerTaskController = new VolunteerTaskController();

const router = Router();

router.use(authorizedMiddleware);

router.get("/", volunteerTaskController.getMyTasks);
router.post("/:id/accept", volunteerTaskController.acceptTask);
router.post("/:id/complete", volunteerTaskController.completeTask);
router.delete("/:id/cancel", volunteerTaskController.cancelTask);

export default router;
