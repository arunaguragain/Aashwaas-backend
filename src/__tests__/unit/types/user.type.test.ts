import { UserSchema } from '../../../types/user.type';

describe('UserSchema', () => {
  test('accepts valid minimal user and sets default role', () => {
    const parsed = UserSchema.safeParse({
      name: 'Aruna',
      email: 'aruna@gmail.com',
      password: 'password1',
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.role).toBe('donor');
    }
  });

  test('accepts optional fields when provided', () => {
    const parsed = UserSchema.safeParse({
      name: 'Arun',
      email: 'arun@gmail.com',
      password: 'longpassword',
      phoneNumber: '1234567890',
      profilePicture: 'pic.png',
      role: 'volunteer',
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.phoneNumber).toBe('1234567890');
      expect(parsed.data.profilePicture).toBe('pic.png');
      expect(parsed.data.role).toBe('volunteer');
    }
  });

  test('rejects short name, invalid email, and short password', () => {
    const parsed = UserSchema.safeParse({
      name: 'A',
      email: 'not-an-email',
      password: 'short',
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => i.path.join('.'));
      expect(issues).toEqual(expect.arrayContaining(['name', 'email', 'password']));
    }
  });
});
