// mock jsonwebtoken so we can control `verify` behavior
jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }));
import { authorizedMiddleware, adminMiddleware } from '../../../middlewares/authorization.middleware';
import * as jwt from 'jsonwebtoken';
import { UserRepository } from '../../../repositories/user.repository';

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('authorization middleware', () => {
  beforeEach(() => jest.restoreAllMocks());

  test('returns 401 when authorization header missing', async () => {
    const req: any = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    await authorizedMiddleware(req, res, next as any);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'Unauthorized, Header malformed' }));
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when token missing after Bearer', async () => {
    const req: any = { headers: { authorization: 'Bearer ' } };
    const res = mockRes();
    const next = jest.fn();

    await authorizedMiddleware(req, res, next as any);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Unauthorized, Token missing' }));
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when jwt.verify throws', async () => {
    const req: any = { headers: { authorization: 'Bearer token' } };
    const res = mockRes();
    const next = jest.fn();

    (jwt as any).verify.mockImplementation(() => { throw new Error('jwt malformed'); });

    await authorizedMiddleware(req, res, next as any);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'jwt malformed' }));
    expect(next).not.toHaveBeenCalled();
  });

  test('jwt.verify error without message yields default', async () => {
    const req: any = { headers: { authorization: 'Bearer token' } };
    const res = mockRes();
    const next = jest.fn();

    (jwt as any).verify.mockImplementation(() => { throw {}; });

    await authorizedMiddleware(req, res, next as any);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when decoded token lacks id', async () => {
    const req: any = { headers: { authorization: 'Bearer token' } };
    const res = mockRes();
    const next = jest.fn();

    (jwt as any).verify.mockReturnValue({});

    await authorizedMiddleware(req, res, next as any);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Unauthorized, Token invalid' }));
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when user not found', async () => {
    const req: any = { headers: { authorization: 'Bearer token' } };
    const res = mockRes();
    const next = jest.fn();

    (jwt as any).verify.mockReturnValue({ id: 'u1' });
    jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValue(null as any);

    await authorizedMiddleware(req, res, next as any);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Unauthorized, User not found' }));
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next and assigns req.user on success', async () => {
    const user = { _id: 'u1', role: 'user' } as any;
    const req: any = { headers: { authorization: 'Bearer token' } };
    const res = mockRes();
    const next = jest.fn();

    (jwt as any).verify.mockReturnValue({ id: 'u1' });
    jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValue(user);

    await authorizedMiddleware(req, res, next as any);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(user);
  });
});

describe('adminMiddleware', () => {
  beforeEach(() => jest.restoreAllMocks());

  test('returns 401 when req.user missing', async () => {
    const req: any = {};
    const res = mockRes();
    const next = jest.fn();

    await adminMiddleware(req, res, next as any);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Unauthorized no user info' }));
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 when user is not admin', async () => {
    const req: any = { user: { role: 'user' } };
    const res = mockRes();
    const next = jest.fn();

    await adminMiddleware(req, res, next as any);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Forbidden not admin' }));
    expect(next).not.toHaveBeenCalled();
  });

  test('adminMiddleware catches generic error without statusCode', async () => {
    // trigger a runtime error inside middleware by throwing from getter
    const req: any = { user: {} };
    Object.defineProperty(req.user, 'role', { get: () => { throw {}; } });
    const res = mockRes();
    const next = jest.fn();

    await adminMiddleware(req, res, next as any);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: undefined });
  });

  test('calls next when user is admin', async () => {
    const req: any = { user: { role: 'admin' } };
    const res = mockRes();
    const next = jest.fn();

    await adminMiddleware(req, res, next as any);

    expect(next).toHaveBeenCalled();
  });

});
 
