import z from "zod";
import { DonationSchema } from "../types/donation.type";

export const CreateDonationDTO = DonationSchema.pick({
    itemName: true,
    category: true,
    description: true,
    quantity: true,
    condition: true,
    pickupLocation: true,
    media: true,
});

export type CreateDonationDTO = z.infer<typeof CreateDonationDTO>;

export const UpdateDonationDTO = DonationSchema.partial();

export type UpdateDonationDTO = z.infer<typeof UpdateDonationDTO>;
