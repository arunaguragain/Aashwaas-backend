import { Request, Response, NextFunction } from "express";
import z from "zod";
import { AdminDonationService } from "../../services/admin/donation.service";
import { AssignTaskDTO } from "../../dtos/task.dto";

let adminDonationService = new AdminDonationService();

export class AdminDonationController {
        async getAllDonations(req: Request, res: Response, next: NextFunction) {
            try {
                const page = req.query.page as string | undefined;
                const size = req.query.size as string | undefined;
                const pageNumber = page ? parseInt(page) : 1;
                const pageSize = size ? parseInt(size) : 10;
                const { donations, total } = await adminDonationService.getAllDonations(pageNumber, pageSize);
                const pagination = {
                    page: pageNumber,
                    size: pageSize,
                    totalItems: total,
                    totalPages: Math.ceil(total / pageSize),
                };
                return res.status(200).json({ success: true, data: donations, pagination, message: "All donations retrieved" });
            } catch (error: Error | any) {
                return res.status(error.statusCode ?? 500).json({ success: false, message: error.message || "Internal Server Error" });
            }
        }

        async getDonationById(req: Request, res: Response, next: NextFunction) {
            try {
                const donationId = req.params.id;
                const donation = await adminDonationService.getDonationById(donationId);
                if (!donation) {
                    return res.status(404).json({ success: false, message: "Donation not found" });
                }
                return res.status(200).json({ success: true, data: donation });
            } catch (error: Error | any) {
                return res.status(error.statusCode ?? 500).json({ success: false, message: error.message || "Internal Server Error" });
            }
        }

        async deleteDonation(req: Request, res: Response, next: NextFunction) {
            try {
                const donationId = req.params.id;
                const deleted = await adminDonationService.deleteDonation(donationId);
                if (!deleted) {
                    return res.status(404).json({ success: false, message: "Donation not found or already deleted" });
                }
                return res.status(200).json({ success: true, message: "Donation deleted" });
            } catch (error: Error | any) {
                return res.status(error.statusCode ?? 500).json({ success: false, message: error.message || "Internal Server Error" });
            }
        }
    async approveDonation(req: Request, res: Response, next: NextFunction) {
        try {
            const donationId = req.params.id;
            const updatedDonation = await adminDonationService.approveDonation(donationId);
            return res.status(200).json(
                { success: true, message: "Donation approved", data: updatedDonation }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async assignDonation(req: Request, res: Response, next: NextFunction) {
        try {
            const donationId = req.params.id;
            const parsedData = AssignTaskDTO.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json(
                    { success: false, message: z.prettifyError(parsedData.error) }
                );
            }
            // Use provided title or a default
            const title = parsedData.data.title || "Assigned Task";
            const { task, alreadyAssigned } = await adminDonationService.assignDonation(
                donationId,
                parsedData.data.volunteerId,
                parsedData.data.ngoId,
                title
            );

            if (alreadyAssigned) {
                return res.status(200).json({
                    success: true,
                    message: "Volunteer and NGO already assigned",
                    data: task
                });
            }

            return res.status(201).json({
                success: true,
                message: "Volunteer and NGO assigned",
                data: task
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }
}
