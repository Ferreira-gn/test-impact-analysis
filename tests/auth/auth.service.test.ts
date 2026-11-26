import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../src/modules/auth/auth.service.js';

describe('AuthService', () => {
  it('logs in the seeded demo user', () => {
    const result = new AuthService('secret').login(
      'demo@example.com',
      'password123',
    );
    expect(result.tokenType).toBe('Bearer');
    expect(result.expiresIn).toBe(900);
    expect(result.accessToken.split('.')).toHaveLength(2);
  });

  it('authenticates a valid access token', () => {
    const service = new AuthService('secret');
    const token = service.login('demo@example.com', 'password123');
    expect(service.authenticate(`Bearer ${token.accessToken}`)).toEqual({
      id: 'user-1',
      email: 'demo@example.com',
    });
  });

  it('rejects an unknown email', () => {
    expect(() =>
      new AuthService().login('unknown@example.com', 'password123'),
    ).toThrow('Invalid credentials');
  });

  it('rejects an incorrect password', () => {
    expect(() =>
      new AuthService().login('demo@example.com', 'wrong-password'),
    ).toThrow('Invalid credentials');
  });

  it('rejects a missing authorization header', () => {
    expect(() => new AuthService().authenticate(undefined)).toThrow(
      'Access token is required',
    );
  });

  it('rejects a non-Bearer authorization scheme', () => {
    expect(() => new AuthService().authenticate('Basic abc')).toThrow(
      'Access token is required',
    );
  });

  it('rejects a malformed token', () => {
    expect(() => new AuthService().authenticate('Bearer malformed')).toThrow(
      'Invalid access token',
    );
  });

  it('rejects a token with a modified signature', () => {
    const service = new AuthService('secret');
    const token = service.login('demo@example.com', 'password123');
    expect(() =>
      service.authenticate(`Bearer ${token.accessToken}tampered`),
    ).toThrow('Invalid access token');
  });

  it('rejects an expired token', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      const service = new AuthService('secret');
      const token = service.login('demo@example.com', 'password123');
      vi.advanceTimersByTime(901_000);
      expect(() => service.authenticate(`Bearer ${token.accessToken}`)).toThrow(
        'Invalid or expired access token',
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('rejects a token signed with another secret', () => {
    const token = new AuthService('secret-a').login(
      'demo@example.com',
      'password123',
    );
    expect(() =>
      new AuthService('secret-b').authenticate(`Bearer ${token.accessToken}`),
    ).toThrow('Invalid access token');
  });

  it('does not reveal the password in the token response', () => {
    const result = new AuthService().login('demo@example.com', 'password123');
    expect(result).not.toHaveProperty('password');
    expect(result).not.toHaveProperty('passwordHash');
  });
});
