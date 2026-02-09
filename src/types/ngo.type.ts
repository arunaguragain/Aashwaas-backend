import z from "zod";

export const NgoSchema = z.object({
    name: z.string().min(2, "NGO name must be at least 2 characters"),
    registrationNumber: z.string().min(3, "Registration number is required"),
    contactPerson: z.string().min(2, "Contact person name is required"),
    phone: z.string().min(7, "Phone number is required"),
    email: z.email(),
    address: z.string().min(5, "Address is required"),
    focusAreas: z.array(z.string().min(2, "Focus area must be at least 2 characters")).optional().default([]),
    photo: z.string().optional(),
});

export type NgoType = z.infer<typeof NgoSchema>;
