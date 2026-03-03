import { jest } from '@jest/globals';

// We'll set up module mocks per-test to ensure the controller's module-level
// `userService` is created from the mocked constructor. See `beforeEach`.

describe('AuthController.googleSignIn', () => {
  let controller: any;
  let UserService: any;

  beforeEach(() => {
    // reset modules and provide fresh mocks so module-level instances are
    // constructed from our mocks.
    jest.resetModules();
    jest.doMock('../../../services/user.service', () => ({
      UserService: jest.fn().mockImplementation(() => ({
        getUserByEmail: jest.fn(),
        findOrCreateFromGoogle: jest.fn(),
      })),
    }));
    jest.doMock('google-auth-library', () => ({
      OAuth2Client: jest.fn().mockImplementation(() => ({
        // @ts-ignore
        verifyIdToken: jest.fn().mockResolvedValue({ getPayload: () => ({
          email: 'test@example.com',
          name: 'Test User',
          picture: 'pic.jpg',
          email_verified: true,
        }) } as any),
      })),
    }));
    jest.doMock('jsonwebtoken', () => ({ sign: jest.fn(() => 'signed-token') }));

    // require after mocks are set
    const mod = require('../../../controllers/auth.controller');
    controller = new mod.AuthController();
    UserService = require('../../../services/user.service').UserService;
  });

  function mockRes() {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    return { status, json } as any;
  }

  test('returns 400 when action=register and email already exists', async () => {
    // the mock constructor's returned instance is available on mock.results
    const userSvcInstance = (UserService as any).mock.results[0].value;
    // eslint-disable-next-line no-console
    console.log('mock results', (UserService as any).mock.results);
    userSvcInstance.getUserByEmail.mockResolvedValue({ _id: 'u1' });

    const req: any = { body: { idToken: 'token', action: 'register' } };
    const res = mockRes();

    await controller.googleSignIn(req, res, jest.fn());
    // debug: show actual response body when status is not as expected
    // eslint-disable-next-line no-console
    console.log('debug register response', res.status.mock.calls, res.status().json.mock.calls);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status().json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'Email already registered' }));
  });

  test('creates or finds user and returns token when not registering or email not existing', async () => {
    const userSvcInstance = (UserService as any).mock.results[0].value;
    // eslint-disable-next-line no-console
    console.log('mock results', (UserService as any).mock.results);
    userSvcInstance.getUserByEmail.mockResolvedValue(null);
    userSvcInstance.findOrCreateFromGoogle.mockResolvedValue({ _id: 'u2', email: 'test@example.com', role: 'user' });

    const req: any = { body: { idToken: 'token' } };
    const res = mockRes();

    await controller.googleSignIn(req, res, jest.fn());
    // debug: show actual response body when status is not as expected
    // eslint-disable-next-line no-console
    console.log('debug signin response', res.status.mock.calls, res.status().json.mock.calls);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.status().json).toHaveBeenCalledWith(expect.objectContaining({ success: true, token: 'signed-token' }));
  });
});
