import { DonationModel, IDonation } from "../models/donation.model";

export interface IDonationRepository {
    createDonation(donationData: Partial<IDonation>): Promise<IDonation>;
    getDonationById(id: string): Promise<IDonation | null>;
    getAllDonations(page: number, size: number): Promise<{ donations: IDonation[]; total: number }>;
    getDonationsByDonorId(donorId: string, page: number, size: number): Promise<{ donations: IDonation[]; total: number }>;
    updateDonation(id: string, updateData: Partial<IDonation>): Promise<IDonation | null>;
    deleteDonation(id: string): Promise<boolean>;
}

export class DonationRepository implements IDonationRepository {
    async createDonation(donationData: Partial<IDonation>): Promise<IDonation> {
        const donation = new DonationModel(donationData);
        return await donation.save();
    }

    async getDonationById(id: string): Promise<IDonation | null> {
        const donation = await DonationModel.findById(id)
            .populate('donorId', 'name email');
        return donation;
    }

    async getAllDonations(page: number, size: number): Promise<{ donations: IDonation[]; total: number }> {
        const [donations, total] = await Promise.all([
            DonationModel.find()
                .skip((page - 1) * size)
                .limit(size)
                .populate('donorId', 'name email'),
            DonationModel.countDocuments(),
        ]);

        return { donations, total };
    }

    async getDonationsByDonorId(donorId: string, page: number, size: number): Promise<{ donations: IDonation[]; total: number }> {
        const filter = { donorId };
        const [donations, total] = await Promise.all([
            DonationModel.find(filter)
                .skip((page - 1) * size)
                .limit(size)
                .populate('donorId', 'name email'),
            DonationModel.countDocuments(filter),
        ]);

        return { donations, total };
    }

    async updateDonation(id: string, updateData: Partial<IDonation>): Promise<IDonation | null> {
        const updatedDonation = await DonationModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        )
            .populate('donorId', 'name email');
        return updatedDonation;
    }

    async deleteDonation(id: string): Promise<boolean> {
        const result = await DonationModel.findByIdAndDelete(id);
        return result ? true : false;
    }
}
