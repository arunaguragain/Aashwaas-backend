import { AdminUserService } from "../../../../services/admin/user.service";
import { UserRepository } from "../../../../repositories/user.repository";
import bcryptjs from "bcryptjs";

describe("AdminUserService", () => {
  let svc: AdminUserService;
  beforeEach(() => {
    jest.restoreAllMocks();
    svc = new AdminUserService();
  });

  describe("createUser", () => {
    test("throws when email exists", async () => {
      jest.spyOn(UserRepository.prototype, "getUserByEmail").mockResolvedValue({} as any);
      await expect(svc.createUser({ email: "a@b.com", password: "p" } as any)).rejects.toThrow("Email already in use");
    });

    test("creates user when email free", async () => {
      jest.spyOn(UserRepository.prototype, "getUserByEmail").mockResolvedValue(null);
      jest.spyOn(bcryptjs as any, "hash").mockResolvedValue("h");
      jest.spyOn(UserRepository.prototype, "createUser").mockResolvedValue({ _id: "u1" } as any);

      const out = await svc.createUser({ email: "b@b.com", password: "p" } as any);
      expect(out).toHaveProperty("_id", "u1");
    });
  });

  describe("getAllUsers", () => {
    test("parses pagination and returns users with pagination", async () => {
      jest.spyOn(UserRepository.prototype, "getAllUsers").mockResolvedValue({ users: [{ _id: "u1" }], total: 1 } as any);
      const res = await svc.getAllUsers("2", "10", "search");
      expect(res).toHaveProperty("users");
      expect(res.pagination).toHaveProperty("page", 2);
      expect(res.pagination).toHaveProperty("size", 10);
    });

    test('defaults page/size when none provided', async () => {
      jest.spyOn(UserRepository.prototype, "getAllUsers").mockResolvedValue({ users: [], total: 0 } as any);
      const res = await svc.getAllUsers(undefined, undefined, undefined);
      expect(res.pagination.page).toBe(1);
      expect(res.pagination.size).toBe(20);
    });
  });

  describe("deleteUser", () => {
    test("throws when not found", async () => {
      jest.spyOn(UserRepository.prototype, "getUserById").mockResolvedValue(null);
      await expect(svc.deleteUser("x")).rejects.toThrow("User not found");
    });

    test("deletes when found", async () => {
      jest.spyOn(UserRepository.prototype, "getUserById").mockResolvedValue({ _id: "u1" } as any);
      jest.spyOn(UserRepository.prototype, "deleteUser").mockResolvedValue(true as any);
      const out = await svc.deleteUser("u1");
      expect(out).toBeTruthy();
    });
  });

  describe("updateUser", () => {
    test("throws when not found", async () => {
      jest.spyOn(UserRepository.prototype, "getUserById").mockResolvedValue(null);
      await expect(svc.updateUser("x", { name: "n" } as any)).rejects.toThrow("User not found");
    });

    test("updates when found", async () => {
      jest.spyOn(UserRepository.prototype, "getUserById").mockResolvedValue({ _id: "u1" } as any);
      jest.spyOn(UserRepository.prototype, "updateUser").mockResolvedValue({ _id: "u1", name: "n" } as any);
      const out = await svc.updateUser("u1", { name: "n" } as any);
      expect(out).toHaveProperty("name", "n");
    });
  });

  describe("getUserById", () => {
    test("throws when not found", async () => {
      jest.spyOn(UserRepository.prototype, "getUserById").mockResolvedValue(null);
      await expect(svc.getUserById("x")).rejects.toThrow("User not found");
    });

    test("returns user when found", async () => {
      jest.spyOn(UserRepository.prototype, "getUserById").mockResolvedValue({ _id: "u1" } as any);
      const out = await svc.getUserById("u1");
      expect(out).toHaveProperty("_id", "u1");
    });
  });
});
