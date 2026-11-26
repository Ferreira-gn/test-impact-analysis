import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';
import { Buffer } from 'node:buffer';
import { AppError } from '../../shared/errors/app-error.js';
import type {
  AccessToken,
  AuthenticatedUser,
} from '../../shared/types/domain.js';

type UserRecord = AuthenticatedUser & {
  passwordHash: string;
  passwordSalt: string;
};

type TokenPayload = {
  sub: string;
  email: string;
  exp: number;
};

const TOKEN_TTL_SECONDS = 900;
const defaultUsers: UserRecord[] = [
  {
    id: 'user-1',
    email: 'demo@example.com',
    passwordHash: '',
    passwordSalt: '',
  },
];

function encode(value: string): string {
  return Buffer
    .from(value, 'utf8')
    .toString('base64url');
}

function decode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 32).toString('hex');
}

function compareSecrets(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function createUser(user: UserRecord, password: string): UserRecord {
  const passwordSalt = randomBytes(16).toString('hex');
  return {
    ...user,
    passwordHash: hashPassword(password, passwordSalt),
    passwordSalt,
  };
}

function isTokenPayload(value: unknown): value is TokenPayload {
  if (typeof value !== 'object' || value === null) return false;
  const payload = Reflect.get(value, 'sub');
  const email = Reflect.get(value, 'email');
  const exp = Reflect.get(value, 'exp');
  return (
    typeof payload === 'string' &&
    typeof email === 'string' &&
    typeof exp === 'number'
  );
}

export class AuthService {
  private readonly users: readonly UserRecord[];

  public constructor(
    private readonly secret = process.env.AUTH_TOKEN_SECRET ??
      'local-development-token-secret',
    users = defaultUsers,
  ) {
    this.users = users.map((user) =>
      user.passwordHash ? user : createUser(user, 'password123'),
    );
  }

  public login(email: string, password: string): AccessToken {
    const user = this.users.find((candidate) => candidate.email === email);
    if (
      !user ||
      !compareSecrets(
        hashPassword(password, user.passwordSalt),
        user.passwordHash,
      )
    )
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

    const expiresIn = TOKEN_TTL_SECONDS;
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + expiresIn,
    };
    const encodedPayload = encode(JSON.stringify(payload));
    const signature = this.sign(encodedPayload);
    return {
      accessToken: `${encodedPayload}.${signature}`,
      tokenType: 'Bearer',
      expiresIn,
    };
  }

  public authenticate(authorization: string | undefined): AuthenticatedUser {
    if (!authorization?.startsWith('Bearer '))
      throw new AppError('Access token is required', 401, 'UNAUTHORIZED');
    const token = authorization.slice('Bearer '.length);
    const parts = token.split('.');
    if (parts.length !== 2)
      throw new AppError('Invalid access token', 401, 'INVALID_TOKEN');
    const [encodedPayload, signature] = parts;
    if (!compareSecrets(this.sign(encodedPayload), signature))
      throw new AppError('Invalid access token', 401, 'INVALID_TOKEN');

    try {
      const parsed: unknown = JSON.parse(decode(encodedPayload));
      if (
        !isTokenPayload(parsed) ||
        parsed.exp <= Math.floor(Date.now() / 1000)
      )
        throw new Error('expired');
      const user = this.users.find(
        (candidate) =>
          candidate.id === parsed.sub && candidate.email === parsed.email,
      );
      if (!user) throw new Error('unknown user');
      return { id: user.id, email: user.email };
    } catch {
      throw new AppError(
        'Invalid or expired access token',
        401,
        'INVALID_TOKEN',
      );
    }
  }

  private sign(payload: string): string {
    return createHmac('sha256', this.secret)
      .update(payload)
      .digest('base64url');
  }
}
