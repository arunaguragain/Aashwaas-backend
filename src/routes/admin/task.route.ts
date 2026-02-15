
import { Router } from 'express';
import { AdminTaskController } from '../../controllers/admin/task.controller';

import { adminMiddleware, authorizedMiddleware } from '../../middlewares/authorization.middleware';

const router = Router();
const adminTaskController = new AdminTaskController();

router.use(authorizedMiddleware);
router.use(adminMiddleware);


router.get('/', adminTaskController.getAllTasks);
router.get('/:id', adminTaskController.getTaskById);
router.post('/', adminTaskController.createTask);
router.put('/:id', adminTaskController.updateTask);
router.delete('/:id', adminTaskController.deleteTask);

export default router;
