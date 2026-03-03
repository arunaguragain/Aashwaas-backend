/* istanbul ignore file */
import { DonationRepository } from "../repositories/donation.repository";
import { IDonation } from "../models/donation.model";
import { HttpError } from "../errors/http-error";
import { UserRepository } from "../repositories/user.repository";
import { sendEmail } from "../config/email";

export class DonationService {
    private donationRepository: DonationRepository;

    constructor(donationRepository?: DonationRepository) {
        this.donationRepository = donationRepository || new DonationRepository();
    }

    async createDonation(donationData: Partial<IDonation>, donorId: string) {
        if (!donorId) {
            throw new HttpError(400, "Donor ID is required");
        }

        donationData.donorId = donorId as any;
        donationData.status = donationData.status || 'pending';

        const newDonation = await this.donationRepository.createDonation(donationData);
        return newDonation;
    }

    async getAllDonations(page?: string, size?: string) {
        const pageNumber = page ? parseInt(page) : 1;
        const pageSize = size ? parseInt(size) : 10;
        const { donations, total } = await this.donationRepository.getAllDonations(pageNumber, pageSize);
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
        const donation = await this.donationRepository.getDonationById(id);
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
        const { donations, total } = await this.donationRepository.getDonationsByDonorId(donorId, pageNumber, pageSize);
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
        const donation = await this.donationRepository.getDonationById(id);
        if (!donation) {
            throw new HttpError(404, "Donation not found");
        }

        const updatedDonation = await this.donationRepository.updateDonation(id, updateData);

        // if donation just transitioned to completed, send thank-you email
        if (
            updatedDonation &&
            updateData.status === 'completed' &&
            donation.status !== 'completed' // originally fetched earlier
        ) {
            try {
                const userRepo = new UserRepository();
                if (donation.donorId) {
                    // donationRepository populates donorId when fetching, so it may already be an object
                    const rawDonor: any = donation.donorId;
                    let donor: any;
                    if (typeof rawDonor === 'object' && rawDonor !== null) {
                        // could be populated document with email/name fields or just an ObjectId wrapper
                        if ('email' in rawDonor) {
                            donor = rawDonor;
                        } else if ('_id' in rawDonor) {
                            donor = await userRepo.getUserById(rawDonor._id.toString());
                        } else {
                            // fallback to string conversion
                            donor = await userRepo.getUserById(rawDonor.toString());
                        }
                    } else {
                        donor = await userRepo.getUserById(rawDonor.toString());
                    }
                    if (donor && donor.email) {
                        /* istanbul ignore next */
                        const html = `<p>Dear ${donor.name || 'Donor'},</p>
<p>Thank you for donating <strong>${updatedDonation.itemName}</strong> through Aashwaas. We really appreciate your generosity!</p>
<p>Your contribution makes a real difference.</p>
<p>Warm regards,<br/>Aashwaas Team</p>`;
                        /* istanbul ignore next */
                        await sendEmail(donor.email, 'Thank you for your donation', html);
                    }
                }
            } catch (e) {
                // log the error but do not block the update flow
                console.error('Failed to send thank you email', e);
            }
        }

        return updatedDonation;
    }

    async deleteDonation(id: string) {
        if (!id) {
            throw new HttpError(400, "Donation ID is required");
        }
        const donation = await this.donationRepository.getDonationById(id);
        if (!donation) {
            throw new HttpError(404, "Donation not found");
        }
        const deleted = await this.donationRepository.deleteDonation(id);
        return deleted;
    }
}
