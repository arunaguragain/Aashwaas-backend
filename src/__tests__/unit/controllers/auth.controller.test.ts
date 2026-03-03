// AuthController is required inside tests to control module load-time env
import { UserService } from '../../../services/user.service';
import { HttpError } from '../../../errors/http-error';
import { AuthController } from '../../../controllers/auth.controller';

jest.mock('../../../services/user.service');

describe('AuthController', () => {
  let controller: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    const controllerModule = require('../../../controllers/auth.controller');
    controller = new controllerModule.AuthController();
  });

  test('googleSignIn strips quotes from GOOGLE_CLIENT_ID entries', async () => {
    const originalEnv = process.env.GOOGLE_CLIENT_ID;
    try {
      await new Promise<void>((resolve) => {
        jest.isolateModules(async () => {
          process.env.GOOGLE_CLIENT_ID = "'idA','idB'";
          jest.unmock('../../../services/user.service');
          const google = require('google-auth-library');
          const verifySpy = jest.spyOn(google.OAuth2Client.prototype, 'verifyIdToken' as any).mockImplementationOnce(async (opts: any) => {
            expect(opts.audience).toEqual(['idA', 'idB']);
            return { getPayload: () => ({ email: 'quoted@x', email_verified: true }) } as any;
          });

          const controllerModule = require('../../../controllers/auth.controller');
          const controller2 = new controllerModule.AuthController();

          const RealUserService = jest.requireActual('../../../services/user.service').UserService;
          jest.spyOn(RealUserService.prototype, 'findOrCreateFromGoogle' as any).mockResolvedValueOnce({ _id: 'uq', email: 'quoted@x', role: 'user' } as any);
          const jwt = require('jsonwebtoken');
          jest.spyOn(jwt, 'sign' as any).mockReturnValueOnce('tokq');

          const req: any = { body: { idToken: 'tokq' } };
          const res = mockRes();
          await controller2.googleSignIn(req, res, jest.fn());
          expect(verifySpy).toHaveBeenCalled();
          resolve();
        });
      });
    } finally {
      process.env.GOOGLE_CLIENT_ID = originalEnv;
    }
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

  test('googleSignIn register returns 400 when email already exists', async () => {
    const req: any = { body: { idToken: 'tok', action: 'register' } };
    const res = mockRes();
    const payload = { email: 'exists@x', name: 'Name', picture: 'pic', email_verified: true };
    const google = require('google-auth-library');
    jest.spyOn(google.OAuth2Client.prototype, 'verifyIdToken' as any).mockResolvedValueOnce({ getPayload: () => payload } as any);
    const existing = { _id: 'u_exists', email: 'exists@x' } as any;
    jest.spyOn(UserService.prototype, 'getUserByEmail' as any).mockResolvedValueOnce(existing as any);

    await controller.googleSignIn(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Email already registered' });
  });

  test('googleSignIn login returns 400 when user not found', async () => {
    const req: any = { body: { idToken: 'tok', action: 'login' } };
    const res = mockRes();
    const payload = { email: 'missing@x', name: 'Name', picture: 'pic', email_verified: true };
    const google = require('google-auth-library');
    jest.spyOn(google.OAuth2Client.prototype, 'verifyIdToken' as any).mockResolvedValueOnce({ getPayload: () => payload } as any);
    jest.spyOn(UserService.prototype, 'getUserByEmail' as any).mockResolvedValueOnce(null);

    await controller.googleSignIn(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Email not registered' });
  });

  test('googleSignIn login succeeds with existing user without creating new', async () => {
    const req: any = { body: { idToken: 'tok', action: 'login' } };
    const res = mockRes();
    const payload = { email: 'exists@x', name: 'Name', picture: 'pic', email_verified: true };
    const google = require('google-auth-library');
    jest.spyOn(google.OAuth2Client.prototype, 'verifyIdToken' as any).mockResolvedValueOnce({ getPayload: () => payload } as any);
    const existing = { _id: 'u_exists', email: 'exists@x', role: 'user' } as any;
    const getSpy = jest.spyOn(UserService.prototype, 'getUserByEmail' as any).mockResolvedValueOnce(existing as any);
    const createSpy = jest.spyOn(UserService.prototype, 'findOrCreateFromGoogle' as any);
    const jwt = require('jsonwebtoken');
    jest.spyOn(jwt, 'sign' as any).mockReturnValueOnce('exist-token');

    await controller.googleSignIn(req, res, jest.fn());
    expect(getSpy).toHaveBeenCalled();
    expect(createSpy).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, token: 'exist-token' }));
  });

  test('exists returns 400 when email missing', async () => {
    const req: any = { query: {} };
    const res = mockRes();
    await controller.exists(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Email is required' });
  });

  test('exists returns true/false appropriately', async () => {
    const req1: any = { query: { email: 'a@b' } };
    const res1 = mockRes();
    jest.spyOn(UserService.prototype, 'getUserByEmail').mockResolvedValueOnce({ _id: 'u1' } as any);
    await controller.exists(req1, res1);
    expect(res1.status).toHaveBeenCalledWith(200);
    expect(res1.json).toHaveBeenCalledWith({ success: true, exists: true });

    const req2: any = { query: { email: 'no@x' } };
    const res2 = mockRes();
    jest.spyOn(UserService.prototype, 'getUserByEmail').mockResolvedValueOnce(null as any);
    await controller.exists(req2, res2);
    expect(res2.status).toHaveBeenCalledWith(200);
    expect(res2.json).toHaveBeenCalledWith({ success: true, exists: false });
  });

  test('exists handles email provided in body instead of query', async () => {
    const req: any = { body: { email: 'body@x' } };
    const res = mockRes();
    jest.spyOn(UserService.prototype, 'getUserByEmail').mockResolvedValueOnce({ _id: 'ub' } as any);
    await controller.exists(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, exists: true });
  });

  test('exists handles underlying service error gracefully', async () => {
    const req: any = { query: { email: 'err@x' } };
    const res = mockRes();
    jest.spyOn(UserService.prototype, 'getUserByEmail').mockRejectedValueOnce(new Error('boom'));
    await controller.exists(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'boom' });
  });

  test('exists handles service error with no message (fallback branch)', async () => {
    const req: any = { query: { email: 'err2@x' } };
    const res = mockRes();
    // simulate an error object lacking a message property
    jest.spyOn(UserService.prototype, 'getUserByEmail').mockRejectedValueOnce({ statusCode: 418 });
    await controller.exists(req, res);
    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
  });

  test('googleSignIn register creates new user when email does not exist', async () => {
    const req: any = { body: { idToken: 'tok', action: 'register' } };
    const res = mockRes();
    const payload = { email: 'newreg@x', name: 'New', picture: 'pic', email_verified: true };
    const google = require('google-auth-library');
    jest.spyOn(google.OAuth2Client.prototype, 'verifyIdToken' as any).mockResolvedValueOnce({ getPayload: () => payload } as any);
    // no existing user
    jest.spyOn(UserService.prototype, 'getUserByEmail' as any).mockResolvedValueOnce(null as any);
    const created = { _id: 'u_new', email: 'newreg@x', role: 'user' } as any;
    jest.spyOn(UserService.prototype, 'findOrCreateFromGoogle' as any).mockResolvedValueOnce(created as any);
    const jwt = require('jsonwebtoken');
    jest.spyOn(jwt, 'sign' as any).mockReturnValueOnce('new-token');

    await controller.googleSignIn(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, token: 'new-token' }));
  });

  test('googleSignIn uses single audience string when only one client id present', async () => {
    const originalEnv = process.env.GOOGLE_CLIENT_ID;
    try {
      await new Promise<void>(resolve => {
        jest.isolateModules(async () => {
          process.env.GOOGLE_CLIENT_ID = 'singleId';
          jest.unmock('../../../services/user.service');
          const google = require('google-auth-library');
          const verifySpy = jest.spyOn(google.OAuth2Client.prototype, 'verifyIdToken' as any).mockImplementationOnce(async (opts: any) => {
            expect(opts.audience).toBe('singleId');
            return { getPayload: () => ({ email: 'a@b', email_verified: true }) } as any;
          });

          const controllerModule = require('../../../controllers/auth.controller');
          const controller2 = new controllerModule.AuthController();
          const RealUserService = jest.requireActual('../../../services/user.service').UserService;
          jest.spyOn(RealUserService.prototype, 'findOrCreateFromGoogle' as any).mockResolvedValueOnce({ _id: 'u', email: 'a@b', role: 'user' } as any);
          const jwt = require('jsonwebtoken');
          jest.spyOn(jwt, 'sign' as any).mockReturnValueOnce('tok');

          const req: any = { body: { idToken: 'tok' } };
          const res = mockRes();
          await controller2.googleSignIn(req, res, jest.fn());
          resolve();
        });
      });
    } finally {
      process.env.GOOGLE_CLIENT_ID = originalEnv;
    }
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

  test('updateProfile updates when no file provided', async () => {
    const updated = { _id: 'u4', name: 'AB' } as any;
    jest.spyOn(UserService.prototype, 'updateUser').mockResolvedValueOnce(updated as any);
    // ensure parsing succeeds for tests that don't stub DTO
    const req: any = { user: { _id: 'u4' }, body: { name: 'AB' } };
    const res = mockRes();
    await controller.updateProfile(req, res);
    expect(UserService.prototype.updateUser).toHaveBeenCalledWith('u4', expect.objectContaining({ name: 'AB' }));
    expect(res.status).toHaveBeenCalledWith(200);
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

  test('sendResetPasswordEmail handles service error', async () => {
    jest.spyOn(UserService.prototype, 'sendResetPasswordEmail').mockRejectedValueOnce(new Error('fail'));
    const req: any = { body: { email: 'u6@x' } };
    const res = mockRes();
    await controller.sendResetPasswordEmail(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'fail' });
  });

  test('sendResetPasswordOTP returns 200 on success', async () => {
    jest.spyOn(UserService.prototype, 'sendResetPasswordOTP').mockResolvedValueOnce(undefined as any);
    const req: any = { body: { email: 'u6@x' } };
    const res = mockRes();
    await controller.sendResetPasswordOTP(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "If the email is registered, an OTP has been sent." });
  });

  test('sendResetPasswordOTP handles service errors', async () => {
    jest.spyOn(UserService.prototype, 'sendResetPasswordOTP').mockRejectedValueOnce(new Error('fail')); 
    const req: any = { body: { email: 'u6@x' } };
    const res = mockRes();
    await controller.sendResetPasswordOTP(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'fail' });
  });

  test('resetPassword returns 200 on success', async () => {
    jest.spyOn(UserService.prototype, 'resetPassword').mockResolvedValueOnce(undefined as any);
    const req: any = { params: { token: 'tok' }, body: { newPassword: 'newpass' } };
    const res = mockRes();
    await controller.resetPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Password has been reset successfully.' });
  });

  test('resetPasswordWithOTP returns 200 on success', async () => {
    jest.spyOn(UserService.prototype, 'resetPasswordWithOTP').mockResolvedValueOnce(undefined as any);
    const req: any = { body: { email: 'u6@x', otp: '123456', newPassword: 'newpass' } };
    const res = mockRes();
    await controller.resetPasswordWithOTP(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Password has been reset successfully.' });
  });

  test('resetPasswordWithOTP handles service errors', async () => {
    jest.spyOn(UserService.prototype, 'resetPasswordWithOTP').mockRejectedValueOnce(new Error('fail')); 
    const req: any = { body: { email: 'u6@x', otp: '123456', newPassword: 'newpass' } };
    const res = mockRes();
    await controller.resetPasswordWithOTP(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'fail' });
  });

  test('sendResetPasswordOTP handles service errors with statusCode only', async () => {
    jest.spyOn(UserService.prototype, 'sendResetPasswordOTP').mockRejectedValueOnce({ statusCode: 404 });
    const req: any = { body: { email: 'u6@x' } };
    const res = mockRes();
    await controller.sendResetPasswordOTP(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
  });

  test('resetPasswordWithOTP handles service errors with statusCode only', async () => {
    jest.spyOn(UserService.prototype, 'resetPasswordWithOTP').mockRejectedValueOnce({ statusCode: 401 });
    const req: any = { body: { email: 'u6@x', otp: '123456', newPassword: 'newpass' } };
    const res = mockRes();
    await controller.resetPasswordWithOTP(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
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
    // ensure validation passes
    jest.spyOn(dtoMod.UpdateUserDTO, 'safeParse').mockReturnValue({ success: true, data: req.body } as any);
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

    // updateProfile during statusCode test (needs validation)
    jest.spyOn(UserService.prototype, 'updateUser').mockRejectedValueOnce(err);
    req = { user: { _id: 'u4' }, body: { name: 'AB' }, file: { filename: 'pic.jpg' } };
    jest.spyOn(dtoMod.UpdateUserDTO, 'safeParse').mockReturnValue({ success: true, data: req.body } as any);
    res = mockRes();
    await controller.updateProfile(req, res);
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

  test('googleSignIn uses array audience when GOOGLE_CLIENT_ID contains multiple ids', async () => {
    const originalEnv = process.env.GOOGLE_CLIENT_ID;
    try {
      await new Promise<void>((resolve) => {
        jest.isolateModules(async () => {
          process.env.GOOGLE_CLIENT_ID = 'id1,id2';
          // ensure the real service is used inside this isolated module registry
          jest.unmock('../../../services/user.service');
          const google = require('google-auth-library');
          const verifySpy = jest.spyOn(google.OAuth2Client.prototype, 'verifyIdToken' as any).mockImplementationOnce(async (opts: any) => {
            expect(opts.audience).toEqual(['id1', 'id2']);
            return { getPayload: () => ({ email: 'a@b', email_verified: true }) } as any;
          });

          const controllerModule = require('../../../controllers/auth.controller');
          const controller2 = new controllerModule.AuthController();

          const RealUserService = jest.requireActual('../../../services/user.service').UserService;
          jest.spyOn(RealUserService.prototype, 'findOrCreateFromGoogle' as any).mockResolvedValueOnce({ _id: 'u', email: 'a@b', role: 'user' } as any);
          const jwt = require('jsonwebtoken');
          jest.spyOn(jwt, 'sign' as any).mockReturnValueOnce('tok');

          const req: any = { body: { idToken: 'tok' } };
          const res = mockRes();
          await controller2.googleSignIn(req, res, jest.fn());
          expect(verifySpy).toHaveBeenCalled();
          resolve();
        });
      });
    } finally {
      process.env.GOOGLE_CLIENT_ID = originalEnv;
    }
  });

  test('googleSignIn uses single audience when GOOGLE_CLIENT_ID is a single id', async () => {
    const originalEnv = process.env.GOOGLE_CLIENT_ID;
    try {
      await new Promise<void>((resolve) => {
        jest.isolateModules(async () => {
          process.env.GOOGLE_CLIENT_ID = 'only-id';
          jest.unmock('../../../services/user.service');
          const google = require('google-auth-library');
          const verifySpy = jest.spyOn(google.OAuth2Client.prototype, 'verifyIdToken' as any).mockImplementationOnce(async (opts: any) => {
            expect(opts.audience).toBe('only-id');
            return { getPayload: () => ({ email: 'a2@b', email_verified: true }) } as any;
          });

          const controllerModule = require('../../../controllers/auth.controller');
          const controller2 = new controllerModule.AuthController();

          const RealUserService = jest.requireActual('../../../services/user.service').UserService;
          jest.spyOn(RealUserService.prototype, 'findOrCreateFromGoogle' as any).mockResolvedValueOnce({ _id: 'u2', email: 'a2@b', role: 'user' } as any);
          const jwt = require('jsonwebtoken');
          jest.spyOn(jwt, 'sign' as any).mockReturnValueOnce('tok2');

          const req: any = { body: { idToken: 'tok2' } };
          const res = mockRes();
          await controller2.googleSignIn(req, res, jest.fn());
          expect(verifySpy).toHaveBeenCalled();
          resolve();
        });
      });
    } finally {
      process.env.GOOGLE_CLIENT_ID = originalEnv;
    }
  });

  test('googleSignIn handles missing GOOGLE_CLIENT_ID (falsy) branch', async () => {
    const originalEnv = process.env.GOOGLE_CLIENT_ID;
    try {
      await new Promise<void>((resolve) => {
        jest.isolateModules(async () => {
          // simulate missing/empty env value to hit the falsy side of `process.env.GOOGLE_CLIENT_ID || ''`
          delete process.env.GOOGLE_CLIENT_ID;
          jest.unmock('../../../services/user.service');
          const google = require('google-auth-library');
          const verifySpy = jest.spyOn(google.OAuth2Client.prototype, 'verifyIdToken' as any).mockImplementationOnce(async (opts: any) => {
            // when no GOOGLE_CLIENT_ID is set, audience may be undefined
            expect(opts.audience === undefined || opts.audience === '').toBeTruthy();
            return { getPayload: () => ({ email: 'falsy@x', email_verified: true }) } as any;
          });

          const controllerModule = require('../../../controllers/auth.controller');
          const controller2 = new controllerModule.AuthController();
          const RealUserService = jest.requireActual('../../../services/user.service').UserService;
          jest.spyOn(RealUserService.prototype, 'findOrCreateFromGoogle' as any).mockResolvedValueOnce({ _id: 'uf', email: 'falsy@x', role: 'user' } as any);
          const jwt = require('jsonwebtoken');
          jest.spyOn(jwt, 'sign' as any).mockReturnValueOnce('tokf');

          const req: any = { body: { idToken: 'tokf' } };
          const res = mockRes();
          await controller2.googleSignIn(req, res, jest.fn());
          expect(verifySpy).toHaveBeenCalled();
          resolve();
        });
      });
    } finally {
      process.env.GOOGLE_CLIENT_ID = originalEnv;
    }
  });

  test('googleSignIn handles empty GOOGLE_CLIENT_ID string branch', async () => {
    const originalEnv = process.env.GOOGLE_CLIENT_ID;
    try {
      await new Promise<void>((resolve) => {
        jest.isolateModules(async () => {
          // simulate empty string env value to hit the alternate side of the || expression
          process.env.GOOGLE_CLIENT_ID = '';
          jest.unmock('../../../services/user.service');
          const google = require('google-auth-library');
          const verifySpy = jest.spyOn(google.OAuth2Client.prototype, 'verifyIdToken' as any).mockImplementationOnce(async (opts: any) => {
            // audience may be undefined or empty when env is empty
            expect(opts.audience === undefined || opts.audience === '').toBeTruthy();
            return { getPayload: () => ({ email: 'empty@x', email_verified: true }) } as any;
          });

          const controllerModule = require('../../../controllers/auth.controller');
          const controller2 = new controllerModule.AuthController();
          const RealUserService = jest.requireActual('../../../services/user.service').UserService;
          jest.spyOn(RealUserService.prototype, 'findOrCreateFromGoogle' as any).mockResolvedValueOnce({ _id: 'ue', email: 'empty@x', role: 'user' } as any);
          const jwt = require('jsonwebtoken');
          jest.spyOn(jwt, 'sign' as any).mockReturnValueOnce('toke');

          const req: any = { body: { idToken: 'toke' } };
          const res = mockRes();
          await controller2.googleSignIn(req, res, jest.fn());
          expect(verifySpy).toHaveBeenCalled();
          resolve();
        });
      });
    } finally {
      process.env.GOOGLE_CLIENT_ID = originalEnv;
    }
  });

  test('googleSignIn handles double-quoted single GOOGLE_CLIENT_ID', async () => {
    const originalEnv = process.env.GOOGLE_CLIENT_ID;
    try {
      await new Promise<void>((resolve) => {
        jest.isolateModules(async () => {
          process.env.GOOGLE_CLIENT_ID = '"only-quoted"';
          jest.unmock('../../../services/user.service');
          const google = require('google-auth-library');
          const verifySpy = jest.spyOn(google.OAuth2Client.prototype, 'verifyIdToken' as any).mockImplementationOnce(async (opts: any) => {
            expect(opts.audience).toBe('only-quoted');
            return { getPayload: () => ({ email: 'dq@x', email_verified: true }) } as any;
          });

          const controllerModule = require('../../../controllers/auth.controller');
          const controller2 = new controllerModule.AuthController();
          const RealUserService = jest.requireActual('../../../services/user.service').UserService;
          jest.spyOn(RealUserService.prototype, 'findOrCreateFromGoogle' as any).mockResolvedValueOnce({ _id: 'udq', email: 'dq@x', role: 'user' } as any);
          const jwt = require('jsonwebtoken');
          jest.spyOn(jwt, 'sign' as any).mockReturnValueOnce('tokdq');

          const req: any = { body: { idToken: 'tokdq' } };
          const res = mockRes();
          await controller2.googleSignIn(req, res, jest.fn());
          expect(verifySpy).toHaveBeenCalled();
          resolve();
        });
      });
    } finally {
      process.env.GOOGLE_CLIENT_ID = originalEnv;
    }
  });

  test('googleSignIn handles single-quoted single GOOGLE_CLIENT_ID', async () => {
    const originalEnv = process.env.GOOGLE_CLIENT_ID;
    try {
      await new Promise<void>((resolve) => {
        jest.isolateModules(async () => {
          process.env.GOOGLE_CLIENT_ID = "'single-quoted'";
          jest.unmock('../../../services/user.service');
          const google = require('google-auth-library');
          const verifySpy = jest.spyOn(google.OAuth2Client.prototype, 'verifyIdToken' as any).mockImplementationOnce(async (opts: any) => {
            expect(opts.audience).toBe('single-quoted');
            return { getPayload: () => ({ email: 'sq@x', email_verified: true }) } as any;
          });

          const controllerModule = require('../../../controllers/auth.controller');
          const controller2 = new controllerModule.AuthController();
          const RealUserService = jest.requireActual('../../../services/user.service').UserService;
          jest.spyOn(RealUserService.prototype, 'findOrCreateFromGoogle' as any).mockResolvedValueOnce({ _id: 'usq', email: 'sq@x', role: 'user' } as any);
          const jwt = require('jsonwebtoken');
          jest.spyOn(jwt, 'sign' as any).mockReturnValueOnce('toksq');

          const req: any = { body: { idToken: 'toksq' } };
          const res = mockRes();
          await controller2.googleSignIn(req, res, jest.fn());
          expect(verifySpy).toHaveBeenCalled();
          resolve();
        });
      });
    } finally {
      process.env.GOOGLE_CLIENT_ID = originalEnv;
    }
  });

  test('googleSignIn handles whitespace-only GOOGLE_CLIENT_ID', async () => {
    const originalEnv = process.env.GOOGLE_CLIENT_ID;
    try {
      await new Promise<void>((resolve) => {
        jest.isolateModules(async () => {
          process.env.GOOGLE_CLIENT_ID = '   ';
          jest.unmock('../../../services/user.service');
          const google = require('google-auth-library');
          const verifySpy = jest.spyOn(google.OAuth2Client.prototype, 'verifyIdToken' as any).mockImplementationOnce(async (opts: any) => {
            expect(opts.audience === undefined || opts.audience === '').toBeTruthy();
            return { getPayload: () => ({ email: 'ws@x', email_verified: true }) } as any;
          });

          const controllerModule = require('../../../controllers/auth.controller');
          const controller2 = new controllerModule.AuthController();
          const RealUserService = jest.requireActual('../../../services/user.service').UserService;
          jest.spyOn(RealUserService.prototype, 'findOrCreateFromGoogle' as any).mockResolvedValueOnce({ _id: 'uws', email: 'ws@x', role: 'user' } as any);
          const jwt = require('jsonwebtoken');
          jest.spyOn(jwt, 'sign' as any).mockReturnValueOnce('tokws');

          const req: any = { body: { idToken: 'tokws' } };
          const res = mockRes();
          await controller2.googleSignIn(req, res, jest.fn());
          expect(verifySpy).toHaveBeenCalled();
          resolve();
        });
      });
    } finally {
      process.env.GOOGLE_CLIENT_ID = originalEnv;
    }
  });

  test('googleSignIn handles GOOGLE_CLIENT_ID entries with extra commas', async () => {
    const originalEnv = process.env.GOOGLE_CLIENT_ID;
    try {
      await new Promise<void>((resolve) => {
        jest.isolateModules(async () => {
          process.env.GOOGLE_CLIENT_ID = 'id1, ,id2,';
          jest.unmock('../../../services/user.service');
          const google = require('google-auth-library');
          const verifySpy = jest.spyOn(google.OAuth2Client.prototype, 'verifyIdToken' as any).mockImplementationOnce(async (opts: any) => {
            // extra commas should be filtered out
            expect(opts.audience).toEqual(['id1', 'id2']);
            return { getPayload: () => ({ email: 'c@x', email_verified: true }) } as any;
          });

          const controllerModule = require('../../../controllers/auth.controller');
          const controller2 = new controllerModule.AuthController();
          const RealUserService = jest.requireActual('../../../services/user.service').UserService;
          jest.spyOn(RealUserService.prototype, 'findOrCreateFromGoogle' as any).mockResolvedValueOnce({ _id: 'uc', email: 'c@x', role: 'user' } as any);
          const jwt = require('jsonwebtoken');
          jest.spyOn(jwt, 'sign' as any).mockReturnValueOnce('tokc');

          const req: any = { body: { idToken: 'tokc' } };
          const res = mockRes();
          await controller2.googleSignIn(req, res, jest.fn());
          expect(verifySpy).toHaveBeenCalled();
          resolve();
        });
      });
    } finally {
      process.env.GOOGLE_CLIENT_ID = originalEnv;
    }
  });

  describe('AuthController - googleSignIn missing idToken', () => {
  test('returns 400 when idToken is not provided', async () => {
    const controller = new AuthController();
    const req: any = { body: {} };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res: any = { status };

    await controller.googleSignIn(req, res, jest.fn() as any);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ success: false, message: 'idToken is required' });
  });
});
});

