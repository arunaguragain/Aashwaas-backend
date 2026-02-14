import z from "zod";

export const TaskSchema = z.object({
    donationId: z.string().min(1, "Donation ID is required"),
    volunteerId: z.string().min(1, "Volunteer ID is required"),
    status: z.enum(["assigned", "accepted", "rejected", "completed"]).default("assigned"),
    assignedAt: z.date().optional(),
    acceptedAt: z.date().optional(),
    completedAt: z.date().optional(),
});

export type TaskType = z.infer<typeof TaskSchema>;
