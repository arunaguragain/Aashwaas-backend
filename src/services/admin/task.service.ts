import mongoose from 'mongoose';
import { HttpError } from '../../errors/http-error';
import { TaskRepository } from '../../repositories/task.repository';
import { UserRepository } from '../../repositories/user.repository';
import { sendEmail } from '../../config/email';

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

  async createTask(data: { title?: string; donationId: string; volunteerId: string; ngoId: string }) {
    if (!data.volunteerId) {
      throw new HttpError(400, 'Volunteer ID is required');
    }
    if (!data.donationId) {
      throw new HttpError(400, 'Donation ID is required');
    }
    // Convert string IDs to ObjectId
    const taskData = {
      ...data,
      donationId: new mongoose.Types.ObjectId(data.donationId),
      volunteerId: new mongoose.Types.ObjectId(data.volunteerId),
      ngoId: data.ngoId ? new mongoose.Types.ObjectId(data.ngoId) : undefined,
    };
    const newTask = await taskRepository.createTask(taskData);

    try {
      const userRepo = new UserRepository();
      const volunteer = await userRepo.getUserById(taskData.volunteerId.toString());
      if (volunteer && volunteer.email) {
        const html = `<p>Dear ${volunteer.name || 'Volunteer'},</p>
<p>You have been assigned a new task titled <strong>${taskData.title || 'No title provided'}</strong>. Please log in to your dashboard for more details.</p>
<p>Thank you for your support!</p>
<p>— Aashwaas Team</p>`;
        await sendEmail(volunteer.email, 'New Task Assigned', html);
      }
    } catch (e) {
      console.error('Failed to send volunteer assignment email', e);
    }

    return newTask;
  }

  async updateTask(id: string, data: { title?: string; donationId: string; volunteerId: string; ngoId: string }) {
    const task = await taskRepository.getTaskById(id);
    if (!task) {
      throw new HttpError(404, 'Task not found');
    }
    // Convert string IDs to ObjectId
    const updateData = {
      ...data,
      donationId: new mongoose.Types.ObjectId(data.donationId),
      volunteerId: new mongoose.Types.ObjectId(data.volunteerId),
      ngoId: data.ngoId ? new mongoose.Types.ObjectId(data.ngoId) : undefined,
    };
    const updated = await taskRepository.updateTask(id, updateData);
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
