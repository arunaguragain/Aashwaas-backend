import mongoose, { Document, Schema } from "mongoose";

const TaskSchema: Schema = new Schema({
    title: { type: String, required: true, trim: true },
    donationId: { type: Schema.Types.ObjectId, required: true, ref: "Donation" },
    volunteerId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    ngoId: { type: Schema.Types.ObjectId, required: false, ref: "Ngo" },
    status: {
        type: String,
        enum: ["assigned", "accepted", "rejected", "completed"],
        default: "assigned",
    },
    assignedAt: { type: Date, default: Date.now },
    acceptedAt: { type: Date },
    completedAt: { type: Date },
}, {
    timestamps: true,
});

export interface ITask extends Document {
    _id: mongoose.Types.ObjectId;
    title: string;
    donationId: mongoose.Types.ObjectId;
    volunteerId: mongoose.Types.ObjectId;
    ngoId?: mongoose.Types.ObjectId;
    status: "assigned" | "accepted" | "rejected" | "completed";
    assignedAt?: Date;
    acceptedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export const TaskModel = mongoose.model<ITask>("Task", TaskSchema);
