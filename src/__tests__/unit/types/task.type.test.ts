import { TaskSchema } from "../../../types/task.type";

describe("TaskSchema", () => {
  it("parses a valid task object", () => {
    const now = new Date();
    const obj = {
      donationId: "d1",
      volunteerId: "v1",
      status: "assigned",
      assignedAt: now,
      acceptedAt: now,
      completedAt: now,
    } as const;

    const parsed = TaskSchema.parse(obj);
    expect(parsed).toMatchObject({ donationId: "d1", volunteerId: "v1", status: "assigned" });
  });

  it("applies default status when omitted", () => {
    const parsed = TaskSchema.parse({ donationId: "d1", volunteerId: "v1" });
    expect(parsed.status).toBe("assigned");
  });

  it("rejects when donationId is missing or empty", () => {
    expect(() => TaskSchema.parse({ volunteerId: "v1" } as any)).toThrow();
    expect(() => TaskSchema.parse({ donationId: "", volunteerId: "v1" } as any)).toThrow();
  });

  it("rejects when volunteerId is missing or empty", () => {
    expect(() => TaskSchema.parse({ donationId: "d1" } as any)).toThrow();
    expect(() => TaskSchema.parse({ donationId: "d1", volunteerId: "" } as any)).toThrow();
  });

  it("rejects invalid status values", () => {
    expect(() => TaskSchema.parse({ donationId: "d1", volunteerId: "v1", status: "bad" } as any)).toThrow();
  });

  it("rejects non-Date types for date fields", () => {
    expect(() => TaskSchema.parse({ donationId: "d1", volunteerId: "v1", assignedAt: "2020-01-01" } as any)).toThrow();
  });
});
