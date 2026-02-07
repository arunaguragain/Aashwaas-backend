import { DonationRepository } from "../repositories/donation.repository";
import { IDonation } from "../models/donation.model";
import { HttpError } from "../errors/http-error";

let donationRepository = new DonationRepository();

export class DonationService {
    async createDonation(donationData: Partial<IDonation>, donorId: string) {
        if (!donorId) {
            throw new HttpError(400, "Donor ID is required");
        }

        donationData.donorId = donorId as any;
        donationData.status = donationData.status || 'pending';

        const newDonation = await donationRepository.createDonation(donationData);
        return newDonation;
    }

    async getAllDonations(page?: string, size?: string) {
        const pageNumber = page ? parseInt(page) : 1;
        const pageSize = size ? parseInt(size) : 10;
        const { donations, total } = await donationRepository.getAllDonations(pageNumber, pageSize);
        const pagination = {
            page: pageNumber,
            size: pageSize,
            totalItems: total,
            totalPages: Math.ceil(total / pageSize),
        };

        return { donations, pagination };
    }

    async getDonationById(id: string) {
        if (!id) {
            throw new HttpError(400, "Donation ID is required");
        }
        const donation = await donationRepository.getDonationById(id);
        if (!donation) {
            throw new HttpError(404, "Donation not found");
        }
        return donation;
    }

    async getDonationsByDonorId(donorId: string, page?: string, size?: string) {
        if (!donorId) {
            throw new HttpError(400, "Donor ID is required");
        }
        const pageNumber = page ? parseInt(page) : 1;
        const pageSize = size ? parseInt(size) : 10;
        const { donations, total } = await donationRepository.getDonationsByDonorId(donorId, pageNumber, pageSize);
        const pagination = {
            page: pageNumber,
            size: pageSize,
            totalItems: total,
            totalPages: Math.ceil(total / pageSize),
        };

        return { donations, pagination };
    }

    async updateDonation(id: string, updateData: Partial<IDonation>) {
        if (!id) {
            throw new HttpError(400, "Donation ID is required");
        }
        const donation = await donationRepository.getDonationById(id);
        if (!donation) {
            throw new HttpError(404, "Donation not found");
        }

        const updatedDonation = await donationRepository.updateDonation(id, updateData);
        return updatedDonation;
    }

    async deleteDonation(id: string) {
        if (!id) {
            throw new HttpError(400, "Donation ID is required");
        }
        const donation = await donationRepository.getDonationById(id);
        if (!donation) {
            throw new HttpError(404, "Donation not found");
        }
        const deleted = await donationRepository.deleteDonation(id);
        return deleted;
    }
}
