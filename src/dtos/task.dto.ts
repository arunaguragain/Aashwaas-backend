import z from "zod";

export const AssignTaskDTO = z.object({
    volunteerId: z.string().min(1, "Volunteer ID is required"),
    ngoId: z.string().min(1, "NGO ID is required"),
});

export type AssignTaskDTO = z.infer<typeof AssignTaskDTO>;
