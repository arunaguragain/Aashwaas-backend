// Mock UserRepository before importing the middleware so the module-level instance is mocked
const mockGetUserById = jest.fn();
jest.mock('../../../repositories/user.repository', () => ({
  UserRepository: jest.fn().mockImplementation(() => ({
    getUserById: mockGetUserById,
  })),
}));

import jwt from 'jsonwebtoken';
import { authorizedMiddleware, adminMiddleware } from '../../../middlewares/authorization.middleware';

describe('authorizedMiddleware', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { headers: {} } as any;
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    next = jest.fn();
  });

  test('calls next and attaches user when token valid and user exists', async () => {
    req.headers.authorization = 'Bearer validtoken';
    jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'u1' } as any);
    mockGetUserById.mockResolvedValueOnce({ _id: 'u1', role: 'donor' });

    await authorizedMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ _id: 'u1', role: 'donor' });
  });

  test('returns 401 when authorization header missing or malformed', async () => {
    req.headers.authorization = undefined;
    await authorizedMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Unauthorized, Header malformed' });
  });

  test('returns 401 when token missing after Bearer', async () => {
    req.headers.authorization = 'Bearer ';
    await authorizedMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Unauthorized, Token missing' });
  });

  test('returns 401 when token invalid (no id)', async () => {
    req.headers.authorization = 'Bearer badtoken';
    jest.spyOn(jwt, 'verify').mockReturnValue({} as any);
    await authorizedMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Unauthorized, Token invalid' });
  });

  test('returns 401 when user not found', async () => {
    req.headers.authorization = 'Bearer validtoken';
    jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'u-notfound' } as any);
    mockGetUserById.mockResolvedValueOnce(null);

    await authorizedMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Unauthorized, User not found' });
  });
});

describe('adminMiddleware', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    next = jest.fn();
  });

  test('returns 401 when no user info', async () => {
    req = {} as any;
    await adminMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Unauthorized no user info' });
  });

  test('returns 403 when user is not admin', async () => {
    req = { user: { role: 'donor' } } as any;
    await adminMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Forbidden not admin' });
  });

  test('calls next when user is admin', async () => {
    req = { user: { role: 'admin' } } as any;
    await adminMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
