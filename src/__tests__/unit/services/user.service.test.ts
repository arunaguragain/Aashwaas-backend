import { UserService } from '../../../services/user.service';
import { UserRepository } from '../../../repositories/user.repository';
import { PasswordResetRepository } from '../../../repositories/passwordReset.repository';
import * as emailMod from '../../../config/email';
import bcrypts from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { HttpError } from '../../../errors/http-error';

jest.mock('../../../repositories/user.repository');
jest.mock('../../../repositories/passwordReset.repository');

describe('UserService OTP flow', () => {
  let svc: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    svc = new UserService();
  });

  test('sendResetPasswordOTP throws 400 when email missing', async () => {
    await expect(svc.sendResetPasswordOTP(undefined)).rejects.toThrow(HttpError);
  });

  test('sendResetPasswordOTP returns quietly when user not found', async () => {
    jest.spyOn(UserRepository.prototype, 'getUserByEmail' as any).mockResolvedValueOnce(null as any);
    const sendSpy = jest.spyOn(emailMod, 'sendEmail').mockResolvedValueOnce(undefined as any);
    await expect(svc.sendResetPasswordOTP('noone@x')).resolves.toBeUndefined();
    expect(sendSpy).not.toHaveBeenCalled();
  });

  test('sendResetPasswordOTP creates record and sends email when user exists', async () => {
    const user = { _id: 'u1', email: 'u1@x' } as any;
    jest.spyOn(UserRepository.prototype, 'getUserByEmail' as any).mockResolvedValueOnce(user as any);
    const createSpy = jest.spyOn(PasswordResetRepository.prototype, 'create' as any).mockResolvedValueOnce({} as any);
    const sendSpy = jest.spyOn(emailMod, 'sendEmail' as any).mockResolvedValueOnce(undefined as any);
    await expect(svc.sendResetPasswordOTP('u1@x')).resolves.toBeUndefined();
    expect(createSpy).toHaveBeenCalled();
    expect(sendSpy).toHaveBeenCalledWith('u1@x', expect.any(String), expect.any(String));
  });

  test('resetPasswordWithOTP validates inputs', async () => {
    await expect(svc.resetPasswordWithOTP(undefined, '1', 'p')).rejects.toThrow(HttpError);
    await expect(svc.resetPasswordWithOTP('a@b', undefined, 'p')).rejects.toThrow(HttpError);
    await expect(svc.resetPasswordWithOTP('a@b', '1', undefined)).rejects.toThrow(HttpError);
  });

  test('resetPasswordWithOTP throws 404 when user missing', async () => {
    jest.spyOn(UserRepository.prototype, 'getUserByEmail' as any).mockResolvedValueOnce(null as any);
    await expect(svc.resetPasswordWithOTP('no@x', '123456', 'np')).rejects.toThrow(HttpError);
  });

  test('resetPasswordWithOTP throws 400 when no record or expired/used', async () => {
    const user = { _id: 'u2', email: 'u2@x' } as any;
    jest.spyOn(UserRepository.prototype, 'getUserByEmail' as any).mockResolvedValueOnce(user as any);
    jest.spyOn(PasswordResetRepository.prototype, 'findLatestByUser' as any).mockResolvedValueOnce(null as any);
    await expect(svc.resetPasswordWithOTP('u2@x', '000000', 'np')).rejects.toThrow(HttpError);
  });

  test('resetPasswordWithOTP invalid OTP increments attempts and throws', async () => {
    const user = { _id: 'u3', email: 'u3@x' } as any;
    const record: any = { _id: 'r1', used: false, expiresAt: new Date(Date.now() + 10000), otpHash: await bcrypts.hash('999999', 10), attempts: 0 };
    jest.spyOn(UserRepository.prototype, 'getUserByEmail' as any).mockResolvedValueOnce(user as any);
    jest.spyOn(PasswordResetRepository.prototype, 'findLatestByUser' as any).mockResolvedValueOnce(record as any);
    const incSpy = jest.spyOn(PasswordResetRepository.prototype, 'incrementAttempts' as any).mockResolvedValueOnce(1 as any);
    await expect(svc.resetPasswordWithOTP('u3@x', '000000', 'np')).rejects.toThrow(HttpError);
    expect(incSpy).toHaveBeenCalledWith('r1');
  });

  test('resetPasswordWithOTP successful flow updates password and marks used', async () => {
    const user = { _id: 'u4', email: 'u4@x' } as any;
    const plainOtp = '123456';
    const record: any = { _id: 'r2', used: false, expiresAt: new Date(Date.now() + 10000), otpHash: await bcrypts.hash(plainOtp, 10), attempts: 0 };
    jest.spyOn(UserRepository.prototype, 'getUserByEmail' as any).mockResolvedValueOnce(user as any);
    jest.spyOn(PasswordResetRepository.prototype, 'findLatestByUser' as any).mockResolvedValueOnce(record as any);
    const updateSpy = jest.spyOn(UserRepository.prototype, 'updateUser' as any).mockResolvedValueOnce(user as any);
    const markSpy = jest.spyOn(PasswordResetRepository.prototype, 'markUsed' as any).mockResolvedValueOnce(undefined as any);
    await expect(svc.resetPasswordWithOTP('u4@x', plainOtp, 'newpass')).resolves.toBe(user);
    expect(updateSpy).toHaveBeenCalled();
    expect(markSpy).toHaveBeenCalledWith('r2');
  });

  test('resetPasswordWithOTP rejects when record already used', async () => {
    const user = { _id: 'ux', email: 'ux@x' } as any;
    const record: any = { _id: 'ru', used: true, expiresAt: new Date(Date.now() + 10000), otpHash: await bcrypts.hash('111111', 10), attempts: 0 };
    jest.spyOn(UserRepository.prototype, 'getUserByEmail' as any).mockResolvedValueOnce(user as any);
    jest.spyOn(PasswordResetRepository.prototype, 'findLatestByUser' as any).mockResolvedValueOnce(record as any);
    await expect(svc.resetPasswordWithOTP('ux@x', '111111', 'np')).rejects.toThrow();
  });

  test('resetPasswordWithOTP rejects when record expired', async () => {
    const user = { _id: 'ue', email: 'ue@x' } as any;
    const record: any = { _id: 're', used: false, expiresAt: new Date(Date.now() - 10000), otpHash: await bcrypts.hash('222222', 10), attempts: 0 };
    jest.spyOn(UserRepository.prototype, 'getUserByEmail' as any).mockResolvedValueOnce(user as any);
    jest.spyOn(PasswordResetRepository.prototype, 'findLatestByUser' as any).mockResolvedValueOnce(record as any);
    await expect(svc.resetPasswordWithOTP('ue@x', '222222', 'np')).rejects.toThrow();
  });

  test('resetPasswordWithOTP invalid OTP that reaches max attempts marks used', async () => {
    const user = { _id: 'um', email: 'um@x' } as any;
    const record: any = { _id: 'rm', used: false, expiresAt: new Date(Date.now() + 10000), otpHash: await bcrypts.hash('333333', 10), attempts: 4 };
    jest.spyOn(UserRepository.prototype, 'getUserByEmail' as any).mockResolvedValueOnce(user as any);
    jest.spyOn(PasswordResetRepository.prototype, 'findLatestByUser' as any).mockResolvedValueOnce(record as any);
    const incSpy = jest.spyOn(PasswordResetRepository.prototype, 'incrementAttempts' as any).mockResolvedValueOnce(5 as any);
    const markSpy = jest.spyOn(PasswordResetRepository.prototype, 'markUsed' as any).mockResolvedValueOnce(undefined as any);
    await expect(svc.resetPasswordWithOTP('um@x', '000000', 'np')).rejects.toThrow();
    expect(incSpy).toHaveBeenCalledWith('rm');
    expect(markSpy).toHaveBeenCalledWith('rm');
  });
});

describe('UserService (core behaviours)', () => {
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

  test('getUserByEmail returns user or null and throws on missing email', async () => {
    const user = { _id: 'u_email', email: 'e@x' } as any;
    jest.spyOn(UserRepository.prototype, 'getUserByEmail').mockResolvedValueOnce(user as any);
    const res = await service.getUserByEmail('e@x');
    expect(res).toEqual(user);

    jest.spyOn(UserRepository.prototype, 'getUserByEmail').mockResolvedValueOnce(null as any);
    const none = await service.getUserByEmail('no@x');
    expect(none).toBeNull();

    await expect(service.getUserByEmail('' as any)).rejects.toEqual(expect.any(Error));
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

