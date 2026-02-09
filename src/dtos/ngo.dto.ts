import z from "zod";
import { NgoSchema } from "../types/ngo.type";

export const CreateNgoDTO = NgoSchema.pick({
    name: true,
    registrationNumber: true,
    contactPerson: true,
    phone: true,
    email: true,
    address: true,
    focusAreas: true,
    photo: true,
});

export type CreateNgoDTO = z.infer<typeof CreateNgoDTO>;

export const UpdateNgoDTO = NgoSchema.partial();

export type UpdateNgoDTO = z.infer<typeof UpdateNgoDTO>;
