import { QueryFilter } from "mongoose";
import { INgo, NgoModel } from "../models/ngo.model";

export interface INgoRepository {
    createNgo(ngoData: Partial<INgo>): Promise<INgo>;
    getNgoById(id: string): Promise<INgo | null>;
    getNgoByEmail(email: string): Promise<INgo | null>;
    getNgoByRegistrationNumber(registrationNumber: string): Promise<INgo | null>;
    getAllNgos(
        page: number,
        size: number,
        search?: string
    ): Promise<{ ngos: INgo[]; total: number }>;
    updateNgo(id: string, updateData: Partial<INgo>): Promise<INgo | null>;
    deleteNgo(id: string): Promise<boolean>;
}

export class NgoRepository implements INgoRepository {
    async createNgo(ngoData: Partial<INgo>): Promise<INgo> {
        const ngo = new NgoModel(ngoData);
        return await ngo.save();
    }

    async getNgoById(id: string): Promise<INgo | null> {
        const ngo = await NgoModel.findById(id);
        return ngo;
    }

    async getNgoByEmail(email: string): Promise<INgo | null> {
        const ngo = await NgoModel.findOne({ email });
        return ngo;
    }

    async getNgoByRegistrationNumber(registrationNumber: string): Promise<INgo | null> {
        const ngo = await NgoModel.findOne({ registrationNumber });
        return ngo;
    }

    async getAllNgos(page: number, size: number, search?: string): Promise<{ ngos: INgo[]; total: number }> {
        const filter: QueryFilter<INgo> = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
                { registrationNumber: { $regex: search, $options: "i" } },
                { contactPerson: { $regex: search, $options: "i" } },
            ];
        }

        const [ngos, total] = await Promise.all([
            NgoModel.find(filter)
                .skip((page - 1) * size)
                .limit(size),
            NgoModel.countDocuments(filter),
        ]);

        return { ngos, total };
    }

    async updateNgo(id: string, updateData: Partial<INgo>): Promise<INgo | null> {
        const updatedNgo = await NgoModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );
        return updatedNgo;
    }

    async deleteNgo(id: string): Promise<boolean> {
        const result = await NgoModel.findByIdAndDelete(id);
        return result ? true : false;
    }
}
