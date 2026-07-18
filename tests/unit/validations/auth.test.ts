import { describe, expect, it } from 'vitest';
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signUpSchema,
} from '@/lib/validations/auth';

describe('signUpSchema', () => {
  it('accepts a valid signup', () => {
    const result = signUpSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const result = signUpSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      confirmPassword: 'different123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['confirmPassword']);
    }
  });

  it('rejects an invalid email', () => {
    const result = signUpSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = signUpSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
      confirmPassword: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a password over 72 characters', () => {
    const longPassword = 'a'.repeat(73);
    const result = signUpSchema.safeParse({
      email: 'user@example.com',
      password: longPassword,
      confirmPassword: longPassword,
    });
    expect(result.success).toBe(false);
  });

  it('trims and lowercases-tolerates whitespace-padded emails', () => {
    const result = signUpSchema.safeParse({
      email: '  user@example.com  ',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });
});

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(
      loginSchema.safeParse({ email: 'user@example.com', password: 'anything' }).success,
    ).toBe(true);
  });

  it('rejects an empty password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing email', () => {
    const result = loginSchema.safeParse({ password: 'anything' });
    expect(result.success).toBe(false);
  });
});

describe('forgotPasswordSchema', () => {
  it('accepts a valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'user@example.com' }).success).toBe(
      true,
    );
  });

  it('rejects an invalid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'nope' }).success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('accepts matching passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'newpassword1',
      confirmPassword: 'newpassword1',
    });
    expect(result.success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'newpassword1',
      confirmPassword: 'newpassword2',
    });
    expect(result.success).toBe(false);
  });
});
