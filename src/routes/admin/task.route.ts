
import { Router } from 'express';
import { AdminTaskController } from '../../controllers/admin/task.controller';

import { adminMiddleware, authorizedMiddleware } from '../../middlewares/authorization.middleware';

const router = Router();
const adminTaskController = new AdminTaskController();

router.use(authorizedMiddleware);
router.use(adminMiddleware);


router.get('/', (req, res, next) => adminTaskController.getAllTasks(req, res, next));
router.get('/:id', (req, res, next) => adminTaskController.getTaskById(req, res, next));
router.post('/', (req, res, next) => adminTaskController.createTask(req, res, next));
router.put('/:id', (req, res, next) => adminTaskController.updateTask(req, res, next));
router.delete('/:id', (req, res, next) => adminTaskController.deleteTask(req, res, next));

export default router;
