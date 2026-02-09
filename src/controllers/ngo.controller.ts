import { Request, Response, NextFunction } from "express";
import { NgoService } from "../services/ngo.service";
import { QueryParams } from "../types/query.type";

let ngoService = new NgoService();

export class NgoController {
    async getAllNgos(req: Request, res: Response, next: NextFunction) {
        try {
            const { page, size, search }: QueryParams = req.query;
            const { ngos, pagination } = await ngoService.getAllNgos(page, size, search);
            return res.status(200).json(
                { success: true, data: ngos, pagination, message: "All NGOs retrieved" }
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
            const ngo = await ngoService.getNgoById(ngoId);
            return res.status(200).json(
                { success: true, data: ngo, message: "NGO retrieved" }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }
}
