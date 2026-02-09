import { Request, Response, NextFunction } from "express";
import z from "zod";
import { CreateNgoDTO, UpdateNgoDTO } from "../../dtos/ngo.dto";
import { AdminNgoService } from "../../services/admin/ngo.service";
import { QueryParams } from "../../types/query.type";

let adminNgoService = new AdminNgoService();

export class AdminNgoController {
    async createNgo(req: Request, res: Response, next: NextFunction) {
        try {
            const parsedData = CreateNgoDTO.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json(
                    { success: false, message: z.prettifyError(parsedData.error) }
                );
            }

            const files = req.files as Record<string, Express.Multer.File[]> | undefined;
            const file = req.file ?? files?.image?.[0] ?? files?.photo?.[0];
            if (file) {
                parsedData.data.photo = file.filename;
            }

            const ngoData: CreateNgoDTO = parsedData.data;
            const newNgo = await adminNgoService.createNgo(ngoData);
            return res.status(201).json(
                { success: true, message: "NGO created", data: newNgo }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async getAllNgos(req: Request, res: Response, next: NextFunction) {
        try {
            const { page, size, search }: QueryParams = req.query;
            const { ngos, pagination } = await adminNgoService.getAllNgos(page, size, search);
            return res.status(200).json(
                {
                    success: true,
                    data: ngos,
                    pagination,
                    message: "All NGOs retrieved",
                }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async getNgoById(req: Request, res: Response, next: NextFunction) {
        try {
            const ngoId = req.params.id;
            const ngo = await adminNgoService.getNgoById(ngoId);
            return res.status(200).json(
                { success: true, data: ngo, message: "Single NGO retrieved" }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async updateNgo(req: Request, res: Response, next: NextFunction) {
        try {
            const ngoId = req.params.id;
            const parsedData = UpdateNgoDTO.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json(
                    { success: false, message: z.prettifyError(parsedData.error) }
                );
            }

            const files = req.files as Record<string, Express.Multer.File[]> | undefined;
            const file = req.file ?? files?.image?.[0] ?? files?.photo?.[0];
            if (file) {
                parsedData.data.photo = file.filename;
            }

            const updateData: UpdateNgoDTO = parsedData.data;
            const updatedNgo = await adminNgoService.updateNgo(ngoId, updateData);
            return res.status(200).json(
                { success: true, message: "NGO updated", data: updatedNgo }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async deleteNgo(req: Request, res: Response, next: NextFunction) {
        try {
            const ngoId = req.params.id;
            const deleted = await adminNgoService.deleteNgo(ngoId);
            if (!deleted) {
                return res.status(404).json(
                    { success: false, message: "NGO not found" }
                );
            }
            return res.status(200).json(
                { success: true, message: "NGO deleted" }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }
}
