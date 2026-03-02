import { AdminUserController } from '../../../../controllers/admin/user.controller';
import { AdminUserService } from '../../../../services/admin/user.service';
import { CreateUserDTO, UpdateUserDTO } from '../../../../dtos/user.dto';

jest.mock('../../../../services/admin/user.service');

describe('AdminUserController', () => {
  let controller: AdminUserController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AdminUserController();
  });

  function mockRes() {
    return { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
  }

  test('createUser returns 400 on validation error and 201 on success', async () => {
    const reqBad: any = { body: { email: 'x' } };
    const resBad = mockRes();
    await controller.createUser(reqBad, resBad, jest.fn());
    expect(resBad.status).toHaveBeenCalledWith(400);

    const newUser = { _id: 'u1', email: 'ok@x' } as any;
    jest.spyOn(AdminUserService.prototype, 'createUser').mockResolvedValueOnce(newUser as any);
    const req: any = { body: { name: 'N', email: 'ok@x', phoneNumber: '1234567890', password: 'Pass1234', confirmPassword: 'Pass1234' }, file: { filename: 'p.jpg' } };
    const dtoMod = require('../../../../dtos/user.dto');
    jest.spyOn(dtoMod.CreateUserDTO, 'safeParse').mockReturnValue({ success: true, data: { ...req.body } });
    const res = mockRes();
    await controller.createUser(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'User Created', data: newUser });
  });

  test('createUser handles service error and generic fallback', async () => {
    const parsed: any = { success: true, data: { email: 'a@b' } };
    jest.spyOn(require('../../../../dtos/user.dto').CreateUserDTO, 'safeParse').mockReturnValue(parsed as any);
    jest.spyOn(AdminUserService.prototype, 'createUser').mockRejectedValueOnce({ statusCode: 418 } as any);
    let req: any = { body: { email: 'a@b' } };
    let res = mockRes();
    await controller.createUser(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(418);

    jest.spyOn(AdminUserService.prototype, 'createUser').mockRejectedValueOnce(new Error('boom'));
    res = mockRes();
    await controller.createUser(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('getAllUsers returns list and pagination', async () => {
    const users = [{ _id: 'u1' }];
    const pagination = { page: 1, size: 10, totalItems: 1, totalPages: 1 };
    jest.spyOn(AdminUserService.prototype, 'getAllUsers').mockResolvedValueOnce({ users, pagination } as any);
    const req: any = { query: { page: '2', size: '2', search: 'x' } };
    const res = mockRes();
    await controller.getAllUsers(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, pagination }));
  });

  test('getAllUsers handles error', async () => {
    jest.spyOn(AdminUserService.prototype, 'getAllUsers').mockRejectedValueOnce(new Error('nope'));
    const res = mockRes();
    await controller.getAllUsers({ query: {} } as any, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('getAllUsers status-only error falls back to default message', async () => {
    jest.spyOn(AdminUserService.prototype, 'getAllUsers').mockRejectedValueOnce({ statusCode: 418 });
    const res = mockRes();
    await controller.getAllUsers({ query: {} } as any, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
  });

  test('updateUser returns 400 on validation error and 200 on success', async () => {
    const reqBad: any = { params: { id: 'u' }, body: { email: 'bad' } };
    const resBad = mockRes();
    await controller.updateUser(reqBad, resBad, jest.fn());
    expect(resBad.status).toHaveBeenCalledWith(400);

    const updated = { _id: 'u', name: 'Updated' } as any;
    jest.spyOn(AdminUserService.prototype, 'updateUser').mockResolvedValueOnce(updated as any);
    const req: any = { params: { id: 'u' }, body: { name: 'Updated' }, file: { filename: 'pic.jpg' } };
    const res = mockRes();
    await controller.updateUser(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'User Updated', data: updated });
  });

  test('updateUser handles service errors', async () => {
    const parsed: any = { success:true, data:{ email:'a@b' } };
    jest.spyOn(UpdateUserDTO, 'safeParse').mockReturnValue(parsed as any);
    jest.spyOn(AdminUserService.prototype, 'updateUser').mockRejectedValueOnce({});
    const req: any = { params:{ id:'u' }, body:{ email:'a@b' } };
    const res = mockRes();
    await controller.updateUser(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('deleteUser returns 200 on success and 404 when not found', async () => {
    jest.spyOn(AdminUserService.prototype, 'deleteUser').mockResolvedValueOnce(true as any);
    const req1: any = { params: { id: 'u1' } };
    const res1 = mockRes();
    await controller.deleteUser(req1, res1, jest.fn());
    expect(res1.status).toHaveBeenCalledWith(200);

    jest.spyOn(AdminUserService.prototype, 'deleteUser').mockResolvedValueOnce(false as any);
    const req2: any = { params: { id: 'u2' } };
    const res2 = mockRes();
    await controller.deleteUser(req2, res2, jest.fn());
    expect(res2.status).toHaveBeenCalledWith(404);

    // error
    jest.spyOn(AdminUserService.prototype, 'deleteUser').mockRejectedValueOnce({});
    const res3 = mockRes();
    await controller.deleteUser(req2, res3, jest.fn());
    expect(res3.status).toHaveBeenCalledWith(500);
  });

  test('getUserById returns 200 with user', async () => {
    const user = { _id: 'u' } as any;
    jest.spyOn(AdminUserService.prototype, 'getUserById').mockResolvedValueOnce(user as any);
    const req: any = { params: { id: 'u' } };
    const res = mockRes();
    await controller.getUserById(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: user, message: 'Single User Retrieved' });
  });

  test('getUserById catches error', async () => {
    jest.spyOn(AdminUserService.prototype, 'getUserById').mockRejectedValueOnce({});
    const req: any = { params: { id: 'u' } };
    const res = mockRes();
    await controller.getUserById(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
