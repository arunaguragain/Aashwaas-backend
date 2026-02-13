import { DonationRepository } from "../../repositories/donation.repository";
import { TaskRepository } from "../../repositories/task.repository";
import { UserRepository } from "../../repositories/user.repository";
import { NgoRepository } from "../../repositories/ngo.repository";
import { HttpError } from "../../errors/http-error";

let donationRepository = new DonationRepository();
let taskRepository = new TaskRepository();
let userRepository = new UserRepository();
let ngoRepository = new NgoRepository();

export class AdminDonationService {
        async getAllDonations(page: number, size: number) {
            return await donationRepository.getAllDonations(page, size);
        }

        async getDonationById(id: string) {
            if (!id) {
                throw new HttpError(400, "Donation ID is required");
            }
            return await donationRepository.getDonationById(id);
        }

        async deleteDonation(id: string) {
            if (!id) {
                throw new HttpError(400, "Donation ID is required");
            }
            return await donationRepository.deleteDonation(id);
        }
    async approveDonation(id: string) {
        if (!id) {
            throw new HttpError(400, "Donation ID is required");
        }

        const donation = await donationRepository.getDonationById(id);
        if (!donation) {
            throw new HttpError(404, "Donation not found");
        }

        if (donation.status !== "pending") {
            throw new HttpError(400, "Only pending donations can be approved");
        }

        const updatedDonation = await donationRepository.updateDonation(id, { status: "approved" });
        return updatedDonation;
    }

    async assignDonation(donationId: string, volunteerId: string, ngoId: string) {
        if (!donationId) {
            throw new HttpError(400, "Donation ID is required");
        }
        if (!volunteerId) {
            throw new HttpError(400, "Volunteer ID is required");
        }
        if (!ngoId) {
            throw new HttpError(400, "NGO ID is required");
        }

        const donation = await donationRepository.getDonationById(donationId);
        if (!donation) {
            throw new HttpError(404, "Donation not found");
        }

        if (donation.status !== "approved") {
            throw new HttpError(400, "Donation must be approved before assignment");
        }

        const volunteer = await userRepository.getUserById(volunteerId);
        if (!volunteer) {
            throw new HttpError(404, "Volunteer not found");
        }
        if (volunteer.role !== "volunteer") {
            throw new HttpError(400, "User is not a volunteer");
        }

        const ngo = await ngoRepository.getNgoById(ngoId);
        if (!ngo) {
            throw new HttpError(404, "NGO not found");
        }

        const activeTask = await taskRepository.getActiveTaskByDonationId(donationId);
        if (activeTask) {
            throw new HttpError(400, "Donation already has an active task");
        }

        const task = await taskRepository.createTask({
            donationId: donation._id,
            volunteerId: volunteer._id,
            ngoId: ngo._id,
            status: "assigned",
            assignedAt: new Date(),
        });

        await donationRepository.updateDonation(donationId, { status: "assigned" });
        return task;
    }
}
