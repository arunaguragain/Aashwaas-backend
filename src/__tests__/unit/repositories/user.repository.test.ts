import { UserRepository } from '../../../repositories/user.repository';
import { UserModel } from '../../../models/user.model';

describe('UserRepository', () => {
  let repo: UserRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new UserRepository();
  });

  test('deleteUser returns true when user deleted and false when not found', async () => {
    const deleted = { _id: 'u1' } as any;
    jest.spyOn(UserModel, 'findByIdAndDelete' as any).mockResolvedValueOnce(deleted as any);
    const res1 = await repo.deleteUser('u1');
    expect(res1).toBe(true);

    jest.spyOn(UserModel, 'findByIdAndDelete' as any).mockResolvedValueOnce(null as any);
    const res2 = await repo.deleteUser('u2');
    expect(res2).toBe(false);
  });

  test('getAllUsers returns users and total without search', async () => {
    const users = [{ _id: 'u1', name: 'A' }];
    const mockLimit = jest.fn().mockResolvedValueOnce(users);
    const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
    jest.spyOn(UserModel, 'find' as any).mockReturnValueOnce({ skip: mockSkip } as any);
    jest.spyOn(UserModel, 'countDocuments' as any).mockResolvedValueOnce(1 as any);

    const res = await repo.getAllUsers(1, 10);
    expect(res.total).toBe(1);
    expect(res.users).toEqual(users);
    expect(mockSkip).toHaveBeenCalledWith(0);
  });

  test('getAllUsers applies search filter when provided', async () => {
    const users = [{ _id: 'u2', name: 'Bob' }];
    const mockLimit = jest.fn().mockResolvedValueOnce(users);
    const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
    const findSpy = jest.spyOn(UserModel, 'find' as any).mockReturnValueOnce({ skip: mockSkip } as any);
    jest.spyOn(UserModel, 'countDocuments' as any).mockResolvedValueOnce(1 as any);

    const res = await repo.getAllUsers(2, 5, 'bob');

    expect(res.total).toBe(1);
    expect(res.users).toEqual(users);
    // skip should be (page-1)*size = (2-1)*5 = 5
    expect(mockSkip).toHaveBeenCalledWith(5);
    // ensure find was called with an object containing $or
    expect(findSpy).toHaveBeenCalledWith(expect.objectContaining({ $or: expect.any(Array) }));
  });

  test('createUser saves and returns created user', async () => {
    const userData = { name: 'New', email: 'new@example.com' } as any;
    const saved = { _id: 'u3', ...userData } as any;
    jest.spyOn(UserModel.prototype, 'save' as any).mockResolvedValueOnce(saved);

    const res = await repo.createUser(userData);
    expect(res).toEqual(saved);
  });

  test('getUserByEmail and getUserById return expected user or null', async () => {
    const u = { _id: 'u4', email: 'u4@example.com' } as any;
    jest.spyOn(UserModel, 'findOne' as any).mockResolvedValueOnce(u);
    const byEmail = await repo.getUserByEmail('u4@example.com');
    expect(byEmail).toEqual(u);

    jest.spyOn(UserModel, 'findById' as any).mockResolvedValueOnce(u);
    const byId = await repo.getUserById('u4');
    expect(byId).toEqual(u);
  });

  test('updateUser returns updated document or null', async () => {
    const updated = { _id: 'u5', name: 'Updated' } as any;
    jest.spyOn(UserModel, 'findByIdAndUpdate' as any).mockResolvedValueOnce(updated as any);
    const res = await repo.updateUser('u5', { name: 'Updated' } as any);
    expect(res).toEqual(updated);

    jest.spyOn(UserModel, 'findByIdAndUpdate' as any).mockResolvedValueOnce(null as any);
    const res2 = await repo.updateUser('missing', { name: 'x' } as any);
    expect(res2).toBeNull();
  });
});
