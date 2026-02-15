import { Request, Response, NextFunction } from "express";
import { CreateDonationDTO, UpdateDonationDTO } from "../dtos/donation.dto";
import z from "zod";
import { QueryParams } from "../types/query.type";
import { DonationService } from "../services/donation.service";

let donationService = new DonationService();

export class DonationController {
    async createDonation(req: Request, res: Response, next: NextFunction) {
        try {
            const parsedData = CreateDonationDTO.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json(
                    { success: false, message: z.prettifyError(parsedData.error) }
                );
            }

            const files = req.files as Record<string, Express.Multer.File[]> | undefined;
            const file = req.file ?? files?.image?.[0] ?? files?.donationPhoto?.[0];
            if (file) {
                parsedData.data.media = file.filename;
            }

            const donationData: CreateDonationDTO = parsedData.data;
            const donorId = req.user?._id?.toString();

            if (!donorId) {
                return res.status(401).json(
                    { success: false, message: "User not authenticated" }
                );
            }

            const newDonation = await donationService.createDonation(donationData, donorId);
            return res.status(201).json(
                { success: true, message: "Donation created successfully", data: newDonation }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async getAllDonations(req: Request, res: Response, next: NextFunction) {
        try {
            const { page, size }: QueryParams = req.query;
            const { donations, pagination } = await donationService.getAllDonations(page, size);
            return res.status(200).json(
                { success: true, data: donations, pagination, message: "All donations retrieved" }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async getDonationById(req: Request, res: Response, next: NextFunction) {
        try {
            const donationId = req.params.id;
            const donation = await donationService.getDonationById(donationId);
            return res.status(200).json(
                { success: true, data: donation, message: "Donation retrieved successfully" }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async getDonationsByDonorId(req: Request, res: Response, next: NextFunction) {
        try {
            const donorId = req.params.donorId;
            const { page, size }: QueryParams = req.query;
            const { donations, pagination } = await donationService.getDonationsByDonorId(donorId, page, size);
            return res.status(200).json(
                { success: true, data: donations, pagination, message: "Donor donations retrieved" }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async getMyDonations(req: Request, res: Response, next: NextFunction) {
        try {
            const donorId = req.user?._id?.toString();
            if (!donorId) {
                return res.status(401).json(
                    { success: false, message: "User not authenticated" }
                );
            }
            const { page, size }: QueryParams = req.query;
            const { donations, pagination } = await donationService.getDonationsByDonorId(donorId, page, size);
            return res.status(200).json(
                { success: true, data: donations, pagination, message: "Your donations retrieved" }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async updateDonation(req: Request, res: Response, next: NextFunction) {
        try {
            const donationId = req.params.id;
            const parsedData = UpdateDonationDTO.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json(
                    { success: false, message: z.prettifyError(parsedData.error) }
                );
            }

            const files = req.files as Record<string, Express.Multer.File[]> | undefined;
            const file = req.file ?? files?.image?.[0] ?? files?.donationPhoto?.[0];
            if (file) {
                parsedData.data.media = file.filename;
            }

            const updateData: UpdateDonationDTO = parsedData.data;
            const updatedDonation = await donationService.updateDonation(donationId, updateData);
            return res.status(200).json(
                { success: true, message: "Donation updated successfully", data: updatedDonation }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async deleteDonation(req: Request, res: Response, next: NextFunction) {
        try {
            const donationId = req.params.id;
            const deleted = await donationService.deleteDonation(donationId);
            if (!deleted) {
                return res.status(404).json(
                    { success: false, message: "Donation not found" }
                );
            }
            return res.status(200).json(
                { success: true, message: "Donation deleted successfully" }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async uploadPhoto(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.file) {
                return res.status(400).json(
                    { success: false, message: "No file uploaded" }
                );
            }

            const filename = req.file.filename;
            return res.status(200).json(
                { success: true, message: "Photo uploaded successfully", data: { filename } }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }
}
