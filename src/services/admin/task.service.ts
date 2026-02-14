
import { TaskRepository } from '../../repositories/task.repository';
import { HttpError } from '../../errors/http-error';

let taskRepository = new TaskRepository();

export class AdminTaskService {
  async getAllTasks(page?: string, size?: string, search?: string) {
    const pageNumber = page ? parseInt(page) : 1;
    const pageSize = size ? parseInt(size) : 10;
    const [tasks, total] = await Promise.all([
      (await import('../../models/task.model')).TaskModel.find()
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize),
      (await import('../../models/task.model')).TaskModel.countDocuments()
    ]);
    const pagination = {
      page: pageNumber,
      size: pageSize,
      totalItems: total,
      totalPages: Math.ceil(total / pageSize),
    };
    return { tasks, pagination };
  }

  async getTaskById(id: string) {
    const task = await taskRepository.getTaskById(id);
    if (!task) {
      throw new HttpError(404, 'Task not found');
    }
    return task;
  }

  async createTask(data: any) {
    const newTask = await taskRepository.createTask(data);
    return newTask;
  }

  async updateTask(id: string, data: any) {
    const task = await taskRepository.getTaskById(id);
    if (!task) {
      throw new HttpError(404, 'Task not found');
    }
    const updated = await taskRepository.updateTask(id, data);
    return updated;
  }

  async deleteTask(id: string) {
    const task = await taskRepository.getTaskById(id);
    if (!task) {
      throw new HttpError(404, 'Task not found');
    }
    return (await import('../../models/task.model')).TaskModel.findByIdAndDelete(id);
  }
}
