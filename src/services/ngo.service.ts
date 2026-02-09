import { NgoRepository } from "../repositories/ngo.repository";
import { HttpError } from "../errors/http-error";

let ngoRepository = new NgoRepository();

export class NgoService {
    async getAllNgos(page?: string, size?: string, search?: string) {
        const pageNumber = page ? parseInt(page) : 1;
        const pageSize = size ? parseInt(size) : 10;
        const { ngos, total } = await ngoRepository.getAllNgos(pageNumber, pageSize, search);
        const pagination = {
            page: pageNumber,
            size: pageSize,
            totalItems: total,
            totalPages: Math.ceil(total / pageSize),
        };

        return { ngos, pagination };
    }

    async getNgoById(id: string) {
        if (!id) {
            throw new HttpError(400, "NGO ID is required");
        }
        const ngo = await ngoRepository.getNgoById(id);
        if (!ngo) {
            throw new HttpError(404, "NGO not found");
        }
        return ngo;
    }
}
