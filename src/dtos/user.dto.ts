import z from "zod";
import { UserSchema } from "../types/user.type";

export const CreateUserDTO = UserSchema.pick(
    {
        name: true,
        email: true,
        phoneNumber: true,
        password: true,
        profilePicture: true,
    }
).extend(
    {
        confirmPassword: z.string().min(8),
        role: z.enum(['admin', 'donor', 'volunteer']).default('donor'),
    }
).refine(
    (data) => data.password === data.confirmPassword,
    {
        message: "Passwords do not match",
        path: ["confirmPassword"]
    }
)
export type CreateUserDTO = z.infer<typeof CreateUserDTO>;

export const LoginUserDTO = z.object({
    email: z.email(),
    password: z.string().min(8)
});

export type LoginUserDTO = z.infer<typeof LoginUserDTO>;

export const UpdateUserDTO = UserSchema.partial();

export type UpdateUserDTO = z.infer<typeof UpdateUserDTO>;