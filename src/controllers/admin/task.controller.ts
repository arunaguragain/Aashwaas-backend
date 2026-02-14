import { Request, Response, NextFunction } from 'express';
import { AdminTaskService } from '../../services/admin/task.service';

let adminTaskService = new AdminTaskService();

export class AdminTaskController {
  async getAllTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, size, search } = req.query;
      const { tasks, pagination } = await adminTaskService.getAllTasks(page as string, size as string, search as string);
      return res.status(200).json({
        success: true,
        data: tasks,
        pagination,
        message: 'All tasks retrieved',
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || 'Internal Server Error',
      });
    }
  }

  async getTaskById(req: Request, res: Response, next: NextFunction) {
    try {
      const taskId = req.params.id;
      const task = await adminTaskService.getTaskById(taskId);
      return res.status(200).json({
        success: true,
        data: task,
        message: 'Single task retrieved',
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || 'Internal Server Error',
      });
    }
  }

  async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const newTask = await adminTaskService.createTask(req.body);
      return res.status(201).json({
        success: true,
        message: 'Task created',
        data: newTask,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || 'Internal Server Error',
      });
    }
  }

  async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const taskId = req.params.id;
      const updatedTask = await adminTaskService.updateTask(taskId, req.body);
      return res.status(200).json({
        success: true,
        message: 'Task updated',
        data: updatedTask,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || 'Internal Server Error',
      });
    }
  }

  async deleteTask(req: Request, res: Response, next: NextFunction) {
    try {
      const taskId = req.params.id;
      await adminTaskService.deleteTask(taskId);
      return res.status(200).json({
        success: true,
        message: 'Task deleted',
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || 'Internal Server Error',
      });
    }
  }
}
