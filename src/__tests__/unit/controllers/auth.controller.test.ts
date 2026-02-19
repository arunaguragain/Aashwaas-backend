import { AuthController } from '../../../controllers/auth.controller';
import { UserService } from '../../../services/user.service';
import { HttpError } from '../../../errors/http-error';

// Mock the UserService to isolate the controller
jest.mock('../../../services/user.service'); 

describe('AuthController', () => {
  let controller: AuthController;
  let mockUserService: jest.Mocked<UserService>; // Type for the mocked service

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthController(); // Create a new instance of the controller
    // Keep `mockUserService` reference if needed, but tests will use prototype spies.
    const MockedUserService = UserService as unknown as jest.MockedClass<typeof UserService>;
    mockUserService = MockedUserService.mock.instances[0] as jest.Mocked<UserService>;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function mockRes() {
    return { status: jest.fn().mockReturnThis(), json: jest.fn() } as any; // Mock the response object
  }

  test('whoami returns 401 when no user', async () => {
    const req: any = {}; // Simulate a request with no authenticated user
    const res = mockRes(); // Mock response

    await controller.whoami(req, res); // Call the controller method

    expect(res.status).toHaveBeenCalledWith(401); // Expect 401 status code for unauthorized
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Unauthorized' });
  });

  test('whoami returns user when authenticated', async () => {
    const user = { _id: 'user1', email: 'user1@gmail.com' }; // Simulated user
    const req: any = { user }; // Request with authenticated user
    const res = mockRes();

    await controller.whoami(req, res);

    expect(res.status).toHaveBeenCalledWith(200); // Expect 200 status for authenticated
    expect(res.json).toHaveBeenCalledWith({ success: true, data: user, message: 'Authenticated user info' });
  });

  test('register returns 200 on success', async () => {
    const newUser = { _id: 'user1', email: 'user1@gmail.com', name: 'Aruna Guragain', password: 'hashed', createdAt: new Date(), updatedAt: new Date(), role: 'donor' };
    const registerSpy = jest.spyOn(UserService.prototype, 'registerUser').mockResolvedValueOnce(newUser as any); // Mock the service to return a new user

    const req: any = { body: { name: 'Aruna Guragain', email: 'user1@gmail.com', password: 'password1', confirmPassword: 'password1' } };
    const res = mockRes();

    await controller.register(req, res);

    expect(registerSpy).toHaveBeenCalled(); // Ensure service method was called
    expect(res.status).toHaveBeenCalledWith(201); // Expect 201 for successful registration
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'User Registered', data: newUser });
  });

  test('register returns 400 on validation error', async () => {
    const req: any = { body: { name: 'Aruna Guragain', email: 'not-an-email', password: 'pass', confirmPassword: 'pass' } };
    const res = mockRes();

    await controller.register(req, res);

    expect(res.status).toHaveBeenCalledWith(400); // Expect 400 for validation failure
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  test('register returns service error status when service throws HttpError', async () => {
    jest.spyOn(UserService.prototype, 'registerUser').mockRejectedValueOnce(new HttpError(409, 'Email exists')); // Simulate service error
    const req: any = { body: { name: 'Aruna Guragain', email: 'user1@gmail.com', password: 'password1', confirmPassword: 'password1' } };
    const res = mockRes();

    await controller.register(req, res);

    expect(res.status).toHaveBeenCalledWith(409); // Expect 409 for conflict
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Email exists' });
  });

  test('login returns 200 and token/data', async () => {
    const existingUser = { _id: 'user1', email: 'user1@gmail.com', name: 'Aruna Guragain', password: 'hashed', createdAt: new Date(), updatedAt: new Date(), role: 'donor' };
    const loginSpy = jest.spyOn(UserService.prototype, 'loginUser').mockResolvedValueOnce({ token: 'tok', existingUser } as any); // Mock login success

    const req: any = { body: { email: 'user1@gmail.com', password: 'password1' } };
    const res = mockRes();

    await controller.login(req, res);

    expect(loginSpy).toHaveBeenCalledWith({ email: 'user1@gmail.com', password: 'password1' });
    expect(res.status).toHaveBeenCalledWith(200); // Expect 200 for successful login
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Login successful', data: existingUser, token: 'tok' });
  });

  test('login returns 400 on validation error', async () => {
    const req: any = { body: { email: 'not-a-email', password: 'pass' } };
    const res = mockRes();

    await controller.login(req, res);

    expect(res.status).toHaveBeenCalledWith(400); // Expect 400 for validation failure
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  test('login returns service error status when service throws HttpError', async () => {
    jest.spyOn(UserService.prototype, 'loginUser').mockRejectedValueOnce(new HttpError(401, 'Invalid credentials')); // Simulate service error
    const req: any = { body: { email: 'user1@gmail.com', password: 'password1' } };
    const res = mockRes();

    await controller.login(req, res);

    expect(res.status).toHaveBeenCalledWith(401); // Expect 401 for invalid credentials
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid credentials' });
  });
});
