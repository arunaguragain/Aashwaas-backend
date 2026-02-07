import { CreateNgoDTO, UpdateNgoDTO } from "../../dtos/ngo.dto";
import { HttpError } from "../../errors/http-error";
import { NgoRepository } from "../../repositories/ngo.repository";

let ngoRepository = new NgoRepository();

export class AdminNgoService {
    async createNgo(data: CreateNgoDTO) {
        const emailCheck = await ngoRepository.getNgoByEmail(data.email);
        if (emailCheck) {
            throw new HttpError(403, "Email already in use");
        }

        const regCheck = await ngoRepository.getNgoByRegistrationNumber(data.registrationNumber);
        if (regCheck) {
            throw new HttpError(403, "Registration number already in use");
        }

        const newNgo = await ngoRepository.createNgo(data);
        return newNgo;
    }

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
        const ngo = await ngoRepository.getNgoById(id);
        if (!ngo) {
            throw new HttpError(404, "NGO not found");
        }
        return ngo;
    }

    async updateNgo(id: string, updateData: UpdateNgoDTO) {
        const ngo = await ngoRepository.getNgoById(id);
        if (!ngo) {
            throw new HttpError(404, "NGO not found");
        }

        if (updateData.email) {
            const emailCheck = await ngoRepository.getNgoByEmail(updateData.email);
            if (emailCheck && emailCheck._id.toString() !== id) {
                throw new HttpError(403, "Email already in use");
            }
        }

        if (updateData.registrationNumber) {
            const regCheck = await ngoRepository.getNgoByRegistrationNumber(updateData.registrationNumber);
            if (regCheck && regCheck._id.toString() !== id) {
                throw new HttpError(403, "Registration number already in use");
            }
        }

        const updatedNgo = await ngoRepository.updateNgo(id, updateData);
        return updatedNgo;
    }

    async deleteNgo(id: string) {
        const ngo = await ngoRepository.getNgoById(id);
        if (!ngo) {
            throw new HttpError(404, "NGO not found");
        }
        const deleted = await ngoRepository.deleteNgo(id);
        return deleted;
    }
}
