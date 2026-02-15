import z from "zod";

export const AssignTaskDTO = z.object({
    title: z.string().min(1, "Title is required"),
    donationId: z.string().min(1, "Donation ID is required"),
    volunteerId: z.string().min(1, "Volunteer ID is required"),
    ngoId: z.string().min(1, "NGO ID is required"),
});

export type AssignTaskDTO = z.infer<typeof AssignTaskDTO>;
