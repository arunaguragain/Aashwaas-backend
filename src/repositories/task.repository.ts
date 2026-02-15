import { ITask, TaskModel } from "../models/task.model";

export interface ITaskRepository {
    createTask(taskData: Partial<ITask>): Promise<ITask>;
    getTaskById(id: string): Promise<ITask | null>;
    getTasksByVolunteerId(volunteerId: string): Promise<ITask[]>;
    getActiveTaskByDonationId(donationId: string): Promise<ITask | null>;
    updateTask(id: string, updateData: Partial<ITask>): Promise<ITask | null>;
    deleteTask(id: string): Promise<ITask | null>;
}

export class TaskRepository implements ITaskRepository {
    async createTask(taskData: Partial<ITask>): Promise<ITask> {
        const task = new TaskModel(taskData);
        return await task.save();
    }

    async getTaskById(id: string): Promise<ITask | null> {
        const task = await TaskModel.findById(id)
            .populate("donationId")
            .populate("volunteerId", "name email role")
            .populate("ngoId", "name email");
        return task;
    }

    async getTasksByVolunteerId(volunteerId: string): Promise<ITask[]> {
        const tasks = await TaskModel.find({ volunteerId })
            .populate("donationId")
            .populate("volunteerId", "name email role")
            .populate("ngoId", "name email");
        return tasks;
    }

    async getActiveTaskByDonationId(donationId: string): Promise<ITask | null> {
        const task = await TaskModel.findOne({
            donationId,
            status: { $in: ["assigned", "accepted"] },
        });
        return task;
    }

    async updateTask(id: string, updateData: Partial<ITask>): Promise<ITask | null> {
        const task = await TaskModel.findByIdAndUpdate(id, updateData, { new: true })
            .populate("donationId")
            .populate("volunteerId", "name email role")
            .populate("ngoId", "name email");
        return task;
    }

    async deleteTask(id: string): Promise<ITask | null> {
        const task = await TaskModel.findByIdAndDelete(id)
            .populate("donationId")
            .populate("volunteerId", "name email role")
            .populate("ngoId", "name email");
        return task;
    }
}
