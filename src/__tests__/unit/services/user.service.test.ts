import { UserService } from '../../../services/user.service';
import { UserRepository } from '../../../repositories/user.repository';
import bcrypts from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('../../../repositories/user.repository');

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserService();
  });

  test('registerUser throws 403 when email exists', async () => {
    jest.spyOn(UserRepository.prototype, 'getUserByEmail').mockResolvedValueOnce({} as any);
    await expect(service.registerUser({ email: 'a@b', password: 'pass' } as any)).rejects.toEqual(expect.any(Error));
  });

  test('registerUser hashes password and calls createUser', async () => {
    jest.spyOn(UserRepository.prototype, 'getUserByEmail').mockResolvedValueOnce(null as any);
    const hashSpy = jest.spyOn(bcrypts as any, 'hash').mockResolvedValueOnce('hashed' as any);
    const created = { _id: 'u1', email: 'a@b' } as any;
    jest.spyOn(UserRepository.prototype, 'createUser').mockResolvedValueOnce(created as any);

    const res = await service.registerUser({ email: 'a@b', password: 'plain' } as any);
    expect(hashSpy).toHaveBeenCalledWith('plain', 10);
    expect(res).toEqual(created);
  });

  test('loginUser throws 404 when user missing', async () => {
    jest.spyOn(UserRepository.prototype, 'getUserByEmail').mockResolvedValueOnce(null as any);
    await expect(service.loginUser({ email: 'x', password: 'p' } as any)).rejects.toEqual(expect.any(Error));
  });

  test('loginUser throws 401 on bad password', async () => {
    const user = { _id: 'u', email: 'a@b', password: 'hashed' } as any;
    jest.spyOn(UserRepository.prototype, 'getUserByEmail').mockResolvedValue(user as any);
    jest.spyOn(bcrypts as any, 'compare').mockResolvedValueOnce(false as any);
    await expect(service.loginUser({ email: 'a@b', password: 'bad' } as any)).rejects.toEqual(expect.any(Error));
  });

  test('loginUser returns token and user on success', async () => {
    const user = { _id: 'u', email: 'a@b', password: 'hashed', role: 'donor' } as any;
    jest.spyOn(UserRepository.prototype, 'getUserByEmail').mockResolvedValueOnce(user as any);
    jest.spyOn(bcrypts as any, 'compare').mockResolvedValueOnce(true as any);
    jest.spyOn(jwt, 'sign').mockReturnValueOnce('tok' as any);

    const res = await service.loginUser({ email: 'a@b', password: 'good' } as any);
    expect(res.token).toBe('tok');
    expect(res.existingUser).toEqual(user);
  });

  test('updateUser throws 404 when user not found', async () => {
    jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValueOnce(null as any);
    await expect(service.updateUser('u', { name: 'x' } as any)).rejects.toEqual(expect.any(Error));
  });

  test('updateUser hashes new password and calls update', async () => {
    const user = { _id: 'u', email: 'a@b' } as any;
    jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValueOnce(user as any);
    const hashSpy = jest.spyOn(bcrypts as any, 'hash').mockResolvedValueOnce('newhash' as any);
    jest.spyOn(UserRepository.prototype, 'getUserByEmail').mockResolvedValue(null as any);
    jest.spyOn(UserRepository.prototype, 'updateUser').mockResolvedValueOnce({ _id: 'u', name: 'x' } as any);

    const res = await service.updateUser('u', { password: 'newpass' } as any);
    expect(hashSpy).toHaveBeenCalledWith('newpass', 10);
    expect(res).toEqual({ _id: 'u', name: 'x' });
  });

  test('updateUser throws 403 when changing to existing email', async () => {
    const user = { _id: 'u', email: 'a@b' } as any;
    jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValueOnce(user as any);
    jest.spyOn(UserRepository.prototype, 'getUserByEmail').mockResolvedValueOnce({ _id: 'other' } as any);
    await expect(service.updateUser('u', { email: 'other@x' } as any)).rejects.toEqual(expect.any(Error));
  });

  test('updateUser skips hashing/email check when no password or email change', async () => {
    const user = { _id: 'u', email: 'a@b' } as any;
    jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValueOnce(user as any);
    jest.spyOn(UserRepository.prototype, 'updateUser').mockResolvedValueOnce({ _id: 'u', name: 'x' } as any);
    const res = await service.updateUser('u', { name: 'x' } as any);
    expect(res).toEqual({ _id: 'u', name: 'x' });
  });

  test('updateUser updates email when changed and not already used', async () => {
    const user = { _id: 'u', email: 'a@b' } as any;
    jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValueOnce(user as any);
    jest.spyOn(UserRepository.prototype, 'getUserByEmail').mockResolvedValueOnce(null as any);
    jest.spyOn(UserRepository.prototype, 'updateUser').mockResolvedValueOnce({ _id: 'u', email: 'new@x' } as any);
    const res = await service.updateUser('u', { email: 'new@x' } as any);
    expect(res).toEqual({ _id: 'u', email: 'new@x' });
  });

  test('updateUser allows same email without calling getUserByEmail', async () => {
    const user = { _id: 'u', email: 'a@b' } as any;
    jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValueOnce(user as any);
    const emailSpy = jest.spyOn(UserRepository.prototype, 'getUserByEmail');
    jest.spyOn(UserRepository.prototype, 'updateUser').mockResolvedValueOnce(user as any);
    const res = await service.updateUser('u', { email: 'a@b' } as any);
    expect(emailSpy).not.toHaveBeenCalled();
    expect(res).toEqual(user);
  });

  test('getUserById throws 404 when not found', async () => {
    jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValueOnce(null as any);
    await expect(service.getUserById('no')).rejects.toEqual(expect.any(Error));
  });

  test('getUserById returns user when found', async () => {
    const user = { _id: 'u1', email: 'a@b' } as any;
    jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValueOnce(user);
    const res = await service.getUserById('u1');
    expect(res).toEqual(user);
  });

  test('sendResetPasswordEmail throws on missing email or not found, otherwise sends email', async () => {
    await expect(service.sendResetPasswordEmail(undefined)).rejects.toEqual(expect.any(Error));
    jest.spyOn(UserRepository.prototype, 'getUserByEmail').mockResolvedValueOnce(null as any);
    await expect(service.sendResetPasswordEmail('a@b')).rejects.toEqual(expect.any(Error));

    const user = { _id: 'u', email: 'a@b' } as any;
    jest.spyOn(UserRepository.prototype, 'getUserByEmail').mockResolvedValueOnce(user as any);
    jest.spyOn(jwt, 'sign').mockReturnValueOnce('resettok' as any);
    const emailMod = require('../../../config/email');
    jest.spyOn(emailMod, 'sendEmail').mockResolvedValueOnce(undefined as any);

    const res = await service.sendResetPasswordEmail('a@b');
    expect(res).toEqual(user);
  });

  test('resetPassword throws on invalid token and succeeds on valid', async () => {
    await expect(service.resetPassword(undefined, 'p')).rejects.toEqual(expect.any(Error));
    jest.spyOn(jwt, 'verify').mockImplementationOnce(() => { throw new Error('bad'); });
    await expect(service.resetPassword('tok', 'p')).rejects.toEqual(expect.any(Error));

    const user = { _id: 'u' } as any;
    jest.spyOn(jwt, 'verify').mockReturnValueOnce({ id: 'u' } as any);
    jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValueOnce(user as any);
    jest.spyOn(bcrypts as any, 'hash').mockResolvedValueOnce('h' as any);
    jest.spyOn(UserRepository.prototype, 'updateUser').mockResolvedValueOnce(user as any);

    const res = await service.resetPassword('tok', 'newp');
    expect(res).toEqual(user);
  });

  test('resetPassword throws when newPassword missing', async () => {
    await expect(service.resetPassword('tok', undefined)).rejects.toEqual(expect.any(Error));
  });

  test('resetPassword throws when user not found after token validated', async () => {
    jest.spyOn(jwt, 'verify').mockReturnValueOnce({ id: 'missing' } as any);
    jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValueOnce(null as any);
    await expect(service.resetPassword('tok', 'newp')).rejects.toEqual(expect.any(Error));
  });

  test('findOrCreateFromGoogle throws when no email, returns existing or creates new', async () => {
    await expect(service.findOrCreateFromGoogle({ email: '' } as any)).rejects.toEqual(expect.any(Error));
    const existing = { _id: 'u', email: 'a@b' } as any;
    jest.spyOn(UserRepository.prototype, 'getUserByEmail').mockResolvedValueOnce(existing as any);
    const res1 = await service.findOrCreateFromGoogle({ email: 'a@b' } as any);
    expect(res1).toEqual(existing);

    jest.spyOn(UserRepository.prototype, 'getUserByEmail').mockResolvedValueOnce(null as any);
    jest.spyOn(bcrypts as any, 'hash').mockResolvedValueOnce('rhash' as any);
    jest.spyOn(UserRepository.prototype, 'createUser').mockResolvedValueOnce({ _id: 'n', email: 'new@x' } as any);
    const res2 = await service.findOrCreateFromGoogle({ email: 'new@x', name: 'N' } as any);
    expect(res2).toEqual({ _id: 'n', email: 'new@x' });

    jest.spyOn(UserRepository.prototype, 'getUserByEmail').mockResolvedValueOnce(null as any);
    jest.spyOn(bcrypts as any, 'hash').mockResolvedValueOnce('rhash2' as any);
    const createSpy = jest.spyOn(UserRepository.prototype, 'createUser').mockResolvedValueOnce({ _id: 'n2', email: 'new2@x' } as any);
    const res3 = await service.findOrCreateFromGoogle({ email: 'new2@x' } as any);
    expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({ name: 'Google User' }));
    expect(res3).toEqual({ _id: 'n2', email: 'new2@x' });
  });
});
