import { AuthController } from '../../../controllers/auth.controller';
import { UserService } from '../../../services/user.service';
import { HttpError } from '../../../errors/http-error';

jest.mock('../../../services/user.service');

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    controller = new AuthController();
  });

  function mockRes() {
    return { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
  }

  test('whoami returns 401 when no user', async () => {
    const req: any = {};
    const res = mockRes();
    await controller.whoami(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Unauthorized' });
  });

  test('whoami returns 200 with user when present', async () => {
    const req: any = { user: { _id: 'u1', email: 'a@b' } };
    const res = mockRes();
    await controller.whoami(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: req.user }));
  });

  test('whoami catches exceptions thrown while reading user', async () => {
    const req: any = {};
    Object.defineProperty(req, 'user', { get: () => { throw new Error('boom'); } });
    const res = mockRes();
    await controller.whoami(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('whoami returns 500 with default message when thrown error has no message', async () => {
    const req: any = {};
    Object.defineProperty(req, 'user', { get: () => { throw {}; } });
    const res = mockRes();
    await controller.whoami(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
  });

  test('whoami propagates statusCode when error thrown has one', async () => {
    const req: any = {};
    Object.defineProperty(req, 'user', { get: () => { throw { statusCode: 418, message: 'oops' }; } });
    const res = mockRes();
    await controller.whoami(req, res);
    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'oops' });
  });

  test('register returns 400 on validation error', async () => {
    const req: any = { body: { email: 'x' } };
    const res = mockRes();
    await controller.register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  test('register returns 201 on success', async () => {
    const newUser = { _id: 'u2', email: 'ok@x' } as any;
    jest.spyOn(UserService.prototype, 'registerUser').mockResolvedValueOnce(newUser);
    const req: any = { body: { name: 'Name', email: 'ok@x', phoneNumber: '1234567890', password: 'Pass1234', confirmPassword: 'Pass1234' } };
    const dtoMod = require('../../../dtos/user.dto');
    jest.spyOn(dtoMod.CreateUserDTO, 'safeParse').mockReturnValue({ success: true, data: req.body });
    const res = mockRes();
    await controller.register(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'User Registered', data: newUser });
  });

  test('login returns 400 on validation error', async () => {
    const req: any = { body: { email: 'x' } };
    const res = mockRes();
    await controller.login(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('login returns 200 on success', async () => {
    const existing = { _id: 'u3', email: 'a@b' } as any;
    jest.spyOn(UserService.prototype, 'loginUser').mockResolvedValueOnce({ token: 't', existingUser: existing } as any);
    const req: any = { body: { email: 'a@b', password: 'password1' } };
    const dtoMod = require('../../../dtos/user.dto');
    jest.spyOn(dtoMod.LoginUserDTO, 'safeParse').mockReturnValue({ success: true, data: req.body });
    const res = mockRes();
    await controller.login(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Login successful', data: existing, token: 't' });
  });

  test('login catch block handles unexpected errors from parsing', async () => {
    const req: any = { body: { email: 'a@b', password: 'password1' } };
    const dtoMod = require('../../../dtos/user.dto');
    // make safeParse throw to hit catch
    jest.spyOn(dtoMod.LoginUserDTO, 'safeParse').mockImplementation(() => { throw new Error('parse fail'); });
    const res = mockRes();
    await controller.login(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('googleSignIn returns 400 when idToken missing', async () => {
    const req: any = { body: {} };
    const res = mockRes();
    await controller.googleSignIn(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('googleSignIn returns 400 when token payload invalid or missing email', async () => {
    const req: any = { body: { idToken: 'tok' } };
    const res = mockRes();
    const google = require('google-auth-library');
    jest.spyOn(google.OAuth2Client.prototype, 'verifyIdToken' as any).mockResolvedValueOnce({ getPayload: () => ({}) } as any);
    await controller.googleSignIn(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('googleSignIn rejects when email not verified', async () => {
    const req: any = { body: { idToken: 'tok' } };
    const res = mockRes();
    const google = require('google-auth-library');
    jest.spyOn(google.OAuth2Client.prototype, 'verifyIdToken' as any).mockResolvedValueOnce({ getPayload: () => ({ email: 'a@b', email_verified: false }) } as any);
    await controller.googleSignIn(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('googleSignIn returns 200 and token on success', async () => {
    const req: any = { body: { idToken: 'tok' } };
    const res = mockRes();
    const payload = { email: 'a@b', name: 'Name', picture: 'pic', email_verified: true };
    const google = require('google-auth-library');
    jest.spyOn(google.OAuth2Client.prototype, 'verifyIdToken' as any).mockResolvedValueOnce({ getPayload: () => payload } as any);
    const user = { _id: 'u7', email: 'a@b', role: 'user' } as any;
    jest.spyOn(UserService.prototype, 'findOrCreateFromGoogle' as any).mockResolvedValueOnce(user as any);
    const jwt = require('jsonwebtoken');
    jest.spyOn(jwt, 'sign' as any).mockReturnValueOnce('signed-token');

    await controller.googleSignIn(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, token: 'signed-token' }));
  });

  test('updateProfile returns 400 when no user id', async () => {
    const req: any = { body: {} };
    const res = mockRes();
    await controller.updateProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('updateProfile returns 400 when validation fails', async () => {
    // mock schema to fail
    const dtoMod = require('../../../dtos/user.dto');
    jest.spyOn(dtoMod.UpdateUserDTO, 'safeParse').mockReturnValue({ success: false, error: { message: 'bad' } } as any);
    const req: any = { user: { _id: 'u4' }, body: { name: '' } };
    const res = mockRes();
    await controller.updateProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('updateProfile updates and includes file filename', async () => {
    const updated = { _id: 'u4', name: 'Updated' } as any;
    jest.spyOn(UserService.prototype, 'updateUser').mockResolvedValueOnce(updated as any);
    const req: any = { user: { _id: 'u4' }, body: { name: 'Updated' }, file: { filename: 'pic.jpg' } };
    const res = mockRes();
    await controller.updateProfile(req, res);
    expect(UserService.prototype.updateUser).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Profile Updated', data: updated });
  });

  test('getUserById returns 200 with user', async () => {
    const user = { _id: 'u5' } as any;
    jest.spyOn(UserService.prototype, 'getUserById').mockResolvedValueOnce(user as any);
    const req: any = { params: { id: 'u5' } };
    const res = mockRes();
    await controller.getUserById(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: user, message: 'Single User Retrieved' });
  });

  test('sendResetPasswordEmail returns 200 on success', async () => {
    const user = { _id: 'u6', email: 'u6@x' } as any;
    jest.spyOn(UserService.prototype, 'sendResetPasswordEmail').mockResolvedValueOnce(user as any);
    const req: any = { body: { email: 'u6@x' } };
    const res = mockRes();
    await controller.sendResetPasswordEmail(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('resetPassword returns 200 on success', async () => {
    jest.spyOn(UserService.prototype, 'resetPassword').mockResolvedValueOnce(undefined as any);
    const req: any = { params: { token: 'tok' }, body: { newPassword: 'newpass' } };
    const res = mockRes();
    await controller.resetPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Password has been reset successfully.' });
  });

  test('methods propagate generic service errors', async () => {
    // register generic
    jest.spyOn(UserService.prototype, 'registerUser').mockRejectedValueOnce({});
    let req: any = { body: { name: 'Name', email: 'ok@x', phoneNumber: '123', password: 'Pass1234', confirmPassword: 'Pass1234' } };
    let res = mockRes();
    const dtoMod = require('../../../dtos/user.dto');
    jest.spyOn(dtoMod.CreateUserDTO, 'safeParse').mockReturnValue({ success: true, data: req.body });
    await controller.register(req, res);
    expect(res.status).toHaveBeenCalledWith(500);

    // login generic
    jest.spyOn(UserService.prototype, 'loginUser').mockRejectedValueOnce({});
    req = { body: { email: 'a@b', password: 'password1' } };
    jest.spyOn(dtoMod.LoginUserDTO, 'safeParse').mockReturnValue({ success: true, data: req.body });
    res = mockRes();
    await controller.login(req, res);
    expect(res.status).toHaveBeenCalledWith(500);

    // googleSignIn verify throws
    req = { body: { idToken: 'tok' } };
    res = mockRes();
    const google = require('google-auth-library');
    jest.spyOn(google.OAuth2Client.prototype, 'verifyIdToken' as any).mockRejectedValueOnce({});
    await controller.googleSignIn(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);

    // updateProfile service error
    jest.spyOn(UserService.prototype, 'updateUser').mockRejectedValueOnce({});
    req = { user: { _id: 'u4' }, body: { name: 'Updated' }, file: { filename: 'pic.jpg' } };
    res = mockRes();
    await controller.updateProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(500);

    // getUserById error
    jest.spyOn(UserService.prototype, 'getUserById').mockRejectedValueOnce({});
    req = { params: { id: 'u5' } };
    res = mockRes();
    await controller.getUserById(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);

    // sendResetPasswordEmail error
    jest.spyOn(UserService.prototype, 'sendResetPasswordEmail').mockRejectedValueOnce({});
    req = { body: { email: 'u6@x' } };
    res = mockRes();
    await controller.sendResetPasswordEmail(req, res);
    expect(res.status).toHaveBeenCalledWith(500);

    // resetPassword error
    jest.spyOn(UserService.prototype, 'resetPassword').mockRejectedValueOnce({});
    req = { params: { token: 'tok' }, body: { newPassword: 'newpass' } };
    res = mockRes();
    await controller.resetPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('service errors propagate provided statusCode and message for all methods', async () => {
    const err: any = { statusCode: 418, message: 'custom' };
    const dtoMod = require('../../../dtos/user.dto');

    // register
    jest.spyOn(UserService.prototype, 'registerUser').mockRejectedValueOnce(err);
    let req: any = { body: { name: 'Name', email: 'ok@x', phoneNumber: '123', password: 'Pass1234', confirmPassword: 'Pass1234' } };
    let res = mockRes();
    jest.spyOn(dtoMod.CreateUserDTO, 'safeParse').mockReturnValue({ success: true, data: req.body });
    await controller.register(req, res);
    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'custom' });

    // login
    jest.spyOn(UserService.prototype, 'loginUser').mockRejectedValueOnce(err);
    req = { body: { email: 'a@b', password: 'p' } };
    jest.spyOn(dtoMod.LoginUserDTO, 'safeParse').mockReturnValue({ success: true, data: req.body });
    res = mockRes();
    await controller.login(req, res);
    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'custom' });

    // googleSignIn
    const google = require('google-auth-library');
    jest.spyOn(google.OAuth2Client.prototype, 'verifyIdToken' as any).mockResolvedValueOnce({ getPayload: () => ({ email: 'a@b', email_verified: true }) } as any);
    jest.spyOn(UserService.prototype, 'findOrCreateFromGoogle' as any).mockRejectedValueOnce(err);
    const jwt = require('jsonwebtoken');
    jest.spyOn(jwt, 'sign' as any).mockReturnValueOnce('tok');
    req = { body: { idToken: 'tok' } };
    res = mockRes();
    await controller.googleSignIn(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'custom' });

    // updateProfile
    jest.spyOn(UserService.prototype, 'updateUser').mockRejectedValueOnce(err);
    req = { user: { _id: 'u4' }, body: { name: 'Updated' } };
    res = mockRes();
    await controller.updateProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'custom' });

    // getUserById
    jest.spyOn(UserService.prototype, 'getUserById').mockRejectedValueOnce(err);
    req = { params: { id: 'u5' } };
    res = mockRes();
    await controller.getUserById(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'custom' });

    // sendResetPasswordEmail
    jest.spyOn(UserService.prototype, 'sendResetPasswordEmail').mockRejectedValueOnce(err);
    req = { body: { email: 'x' } };
    res = mockRes();
    await controller.sendResetPasswordEmail(req, res);
    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'custom' });

    // resetPassword
    jest.spyOn(UserService.prototype, 'resetPassword').mockRejectedValueOnce(err);
    req = { params: { token: 'tok' }, body: { newPassword: 'np' } };
    res = mockRes();
    await controller.resetPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'custom' });
  });

  test('updateProfile updates without file when none provided', async () => {
    const updated = { _id: 'u4' } as any;
    jest.spyOn(UserService.prototype, 'updateUser').mockResolvedValueOnce(updated as any);
    const req: any = { user: { _id: 'u4' }, body: { name: 'Updated' } };
    const res = mockRes();
    await controller.updateProfile(req, res);
    expect(UserService.prototype.updateUser).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

