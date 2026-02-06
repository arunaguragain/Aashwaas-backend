import { DonationModel, IDonation } from "../models/donation.model";

export interface IDonationRepository {
    createDonation(donationData: Partial<IDonation>): Promise<IDonation>;
    getDonationById(id: string): Promise<IDonation | null>;
    getAllDonations(): Promise<IDonation[]>;
    getDonationsByDonorId(donorId: string): Promise<IDonation[]>;
    updateDonation(id: string, updateData: Partial<IDonation>): Promise<IDonation | null>;
    deleteDonation(id: string): Promise<boolean>;
}

export class DonationRepository implements IDonationRepository {
    async createDonation(donationData: Partial<IDonation>): Promise<IDonation> {
        const donation = new DonationModel(donationData);
        return await donation.save();
    }

    async getDonationById(id: string): Promise<IDonation | null> {
        const donation = await DonationModel.findById(id).populate('donorId', 'name email');
        return donation;
    }

    async getAllDonations(): Promise<IDonation[]> {
        const donations = await DonationModel.find().populate('donorId', 'name email');
        return donations;
    }

    async getDonationsByDonorId(donorId: string): Promise<IDonation[]> {
        const donations = await DonationModel.find({ donorId }).populate('donorId', 'name email');
        return donations;
    }

    async updateDonation(id: string, updateData: Partial<IDonation>): Promise<IDonation | null> {
        const updatedDonation = await DonationModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate('donorId', 'name email');
        return updatedDonation;
    }

    async deleteDonation(id: string): Promise<boolean> {
        const result = await DonationModel.findByIdAndDelete(id);
        return result ? true : false;
    }
}
