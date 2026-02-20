import { AssignTaskDTO } from "../../../dtos/task.dto";
import z from "zod";

describe("AssignTaskDTO", () => {
  it("should validate a correct payload", () => {
    const validPayload = {
      title: "Task Title",
      donationId: "donation123",
      volunteerId: "volunteer456",
      ngoId: "ngo789"
    };
    expect(() => AssignTaskDTO.parse(validPayload)).not.toThrow();
  });

  it("should throw error for missing fields", () => {
    const invalidPayload = {
      title: "",
      donationId: "",
      volunteerId: "",
      ngoId: ""
    };
    expect(() => AssignTaskDTO.parse(invalidPayload)).toThrow(z.ZodError);
  });

  it("should throw error for completely empty payload", () => {
    expect(() => AssignTaskDTO.parse({})).toThrow(z.ZodError);
  });
});
