import { Request, Response, NextFunction } from "express";
import { VolunteerTaskService } from "../../services/volunteer/task.service";

let volunteerTaskService = new VolunteerTaskService();

export class VolunteerTaskController {
    async getMyTasks(req: Request, res: Response, next: NextFunction) {
        try {
            const volunteerId = req.user?._id?.toString();
            if (!volunteerId) {
                return res.status(401).json(
                    { success: false, message: "User not authenticated" }
                );
            }

            const tasks = await volunteerTaskService.getMyTasks(volunteerId);
            return res.status(200).json(
                { success: true, data: tasks, message: "Tasks retrieved" }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async acceptTask(req: Request, res: Response, next: NextFunction) {
        try {
            const volunteerId = req.user?._id?.toString();
            if (!volunteerId) {
                return res.status(401).json(
                    { success: false, message: "User not authenticated" }
                );
            }

            const taskId = req.params.id;
            const updatedTask = await volunteerTaskService.acceptTask(taskId, volunteerId);
            return res.status(200).json(
                { success: true, data: updatedTask, message: "Task accepted" }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async completeTask(req: Request, res: Response, next: NextFunction) {
        try {
            const volunteerId = req.user?._id?.toString();
            if (!volunteerId) {
                return res.status(401).json(
                    { success: false, message: "User not authenticated" }
                );
            }

            const taskId = req.params.id;
            const updatedTask = await volunteerTaskService.completeTask(taskId, volunteerId);
            return res.status(200).json(
                { success: true, data: updatedTask, message: "Task completed" }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async cancelTask(req: Request, res: Response, next: NextFunction) {
        try {
            const volunteerId = req.user?._id?.toString();
            if (!volunteerId) {
                return res.status(401).json(
                    { success: false, message: "User not authenticated" }
                );
            }

            const taskId = req.params.id;
            await volunteerTaskService.cancelTask(taskId, volunteerId);
            return res.status(200).json(
                { success: true, message: "Task cancelled" }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }
}
