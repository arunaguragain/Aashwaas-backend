import { DonationRepository } from "../../repositories/donation.repository";
import { TaskRepository } from "../../repositories/task.repository";
import { HttpError } from "../../errors/http-error";
import { DonationService } from "../donation.service";

// repositories instantiated here for backward compatibility with existing tests
let taskRepository = new TaskRepository();
// donationRepository is no longer used directly for completions; kept for tests that still spy on it
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
        // update through service so email logic runs when donation becomes completed
        const donationService = new DonationService();
        await donationService.updateDonation(donationId, { status: "completed" });
        return updatedTask;
    }

    async cancelTask(taskId: string, volunteerId: string) {
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

        // Allow cancellation for assigned or accepted tasks
        if (!["assigned", "accepted"].includes(task.status)) {
            throw new HttpError(400, "Only assigned or accepted tasks can be cancelled");
        }

        // Delete the task
        const deleted = await taskRepository.deleteTask(taskId);
        return deleted;
    }
}
