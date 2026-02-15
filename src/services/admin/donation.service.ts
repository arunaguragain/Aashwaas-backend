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
            const donation = await donationRepository.getDonationById(id);
            if (!donation) {
                throw new HttpError(404, "Donation not found");
            }
            // Fetch active assignment task for this donation
            const activeTask = await taskRepository.getActiveTaskByDonationId(id);
            let assignment = null;
            if (activeTask) {
                let volunteerId, volunteerName, ngoId, ngoName;
                // Volunteer
                if (typeof activeTask.volunteerId === 'object' && activeTask.volunteerId !== null && 'name' in activeTask.volunteerId) {
                    volunteerId = activeTask.volunteerId._id;
                    volunteerName = activeTask.volunteerId.name;
                } else {
                    volunteerId = activeTask.volunteerId;
                    // Fetch user if not populated
                    const volunteer = await userRepository.getUserById(String(volunteerId));
                    volunteerName = volunteer ? volunteer.name : undefined;
                }
                // NGO
                if (typeof activeTask.ngoId === 'object' && activeTask.ngoId !== null && 'name' in activeTask.ngoId) {
                    ngoId = activeTask.ngoId._id;
                    ngoName = activeTask.ngoId.name;
                } else {
                    ngoId = activeTask.ngoId;
                    // Fetch NGO if not populated
                    const ngo = await ngoRepository.getNgoById(String(ngoId));
                    ngoName = ngo ? ngo.name : undefined;
                }
                assignment = { volunteerId, volunteerName, ngoId, ngoName };
            }
            // Return donation details with assignment info
            return { ...donation.toObject(), assignment };
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

    async assignDonation(donationId: string, volunteerId: string, ngoId: string, title: string) {
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
            // Idempotent: return existing task
            return { task: activeTask, alreadyAssigned: true };
        }

        const task = await taskRepository.createTask({
            title,
            donationId: donation._id,
            volunteerId: volunteer._id,
            ngoId: ngo._id,
            status: "assigned",
            assignedAt: new Date(),
        });

        await donationRepository.updateDonation(donationId, { status: "assigned" });
        return { task, alreadyAssigned: false };
    }
}
