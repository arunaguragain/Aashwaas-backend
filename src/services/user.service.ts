import { CreateUserDTO, LoginUserDTO, UpdateUserDTO } from "../dtos/user.dto";
import { UserRepository } from "../repositories/user.repository";
import bcrypts from "bcryptjs";
import { HttpError } from "../errors/http-error";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";

let userRepository = new UserRepository();

export class UserService{
    async registerUser(data: CreateUserDTO){
        const checkEmail = await userRepository.getUserByEmail(data.email);
        if(checkEmail){
            throw new HttpError(403, "Email already in use");
        }
        const hashedPassword = await bcrypts.hash(data.password, 10); //10 - complexity
        data.password = hashedPassword; //update the password with hased one
        const newUser = await userRepository.createUser(data);
        return newUser;
    }
    async loginUser(data: LoginUserDTO){
        const existingUser = await userRepository.getUserByEmail(data.email);
        if(!existingUser){
            throw new HttpError(404, "User not found");
        }
        const isPasswordValid = await bcrypts.compare(data.password, existingUser.password); 
        if(!isPasswordValid){
            throw new HttpError(401, "Invalid credentials");
        }
        const payload = {
            id: existingUser._id,
            email: existingUser.email,
            role: existingUser.role,
        }; 
        const token = jwt.sign(payload, JWT_SECRET, {expiresIn: '30d'}); 
        return{token, existingUser}
    }

    async updateUser(id: string, updateData: UpdateUserDTO) {
        const user = await userRepository.getUserById(id);
        if (!user) {
            throw new HttpError(404, "User not found");
        }

        // If password is being updated, hash it
        if (updateData.password) {
            updateData.password = await bcrypts.hash(updateData.password, 10);
        }

        // Check if email is being updated and if it's already in use
        if (updateData.email && updateData.email !== user.email) {
            const emailExists = await userRepository.getUserByEmail(updateData.email);
            if (emailExists) {
                throw new HttpError(403, "Email already in use");
            }
        }

        const updatedUser = await userRepository.updateUser(id, updateData);
        return updatedUser;
    }
}