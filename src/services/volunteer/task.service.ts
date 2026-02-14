import { DonationRepository } from "../../repositories/donation.repository";
import { TaskRepository } from "../../repositories/task.repository";
import { HttpError } from "../../errors/http-error";

let taskRepository = new TaskRepository();
let donationRepository = new DonationRepository();

export class VolunteerTaskService {
    async getMyTasks(volunteerId: string) {
        if (!volunteerId) {
            throw new HttpError(400, "Volunteer ID is required");
        }
        const tasks = await taskRepository.getTasksByVolunteerId(volunteerId);
        return tasks;
    }

    async acceptTask(taskId: string, volunteerId: string) {
        if (!taskId) {
            throw new HttpError(400, "Task ID is required");
        }
        if (!volunteerId) {
            throw new HttpError(400, "Volunteer ID is required");
        }

        const task = await taskRepository.getTaskById(taskId);
        if (!task) {
            throw new HttpError(404, "Task not found");
        }
        const taskVolunteerId = (task.volunteerId as any)?._id?.toString() ?? task.volunteerId.toString();
        if (taskVolunteerId !== volunteerId) {
            throw new HttpError(403, "Not authorized for this task");
        }
        if (task.status !== "assigned") {
            throw new HttpError(400, "Only assigned tasks can be accepted");
        }

        const updatedTask = await taskRepository.updateTask(taskId, {
            status: "accepted",
            acceptedAt: new Date(),
        });
        return updatedTask;
    }

    async completeTask(taskId: string, volunteerId: string) {
        if (!taskId) {
            throw new HttpError(400, "Task ID is required");
        }
        if (!volunteerId) {
            throw new HttpError(400, "Volunteer ID is required");
        }

        const task = await taskRepository.getTaskById(taskId);
        if (!task) {
            throw new HttpError(404, "Task not found");
        }
        const taskVolunteerId = (task.volunteerId as any)?._id?.toString() ?? task.volunteerId.toString();
        if (taskVolunteerId !== volunteerId) {
            throw new HttpError(403, "Not authorized for this task");
        }
        if (task.status !== "accepted") {
            throw new HttpError(400, "Only accepted tasks can be completed");
        }

        const updatedTask = await taskRepository.updateTask(taskId, {
            status: "completed",
            completedAt: new Date(),
        });

        const donationId = (task.donationId as any)?._id?.toString() ?? task.donationId.toString();
        await donationRepository.updateDonation(donationId, { status: "completed" });
        return updatedTask;
    }
}
