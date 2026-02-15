import { Request, Response, NextFunction } from 'express';
import { AdminTaskService } from '../../services/admin/task.service';
import { AssignTaskDTO } from '../../dtos/task.dto';
import z from 'zod';

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
      // console.log('Task creation request body:', req.body);
      // console.log('typeof req.body.donationId:', typeof req.body.donationId);
      const parsedData = AssignTaskDTO.safeParse(req.body);
      if (!parsedData.success) {
        console.log('Full Zod error:', parsedData.error);
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error)
        });
      }
      const newTask = await adminTaskService.createTask(parsedData.data);
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
      const parsedData = AssignTaskDTO.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error)
        });
      }
      const updatedTask = await adminTaskService.updateTask(taskId, parsedData.data);
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
