import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

const now = new Date();
const dbUser = {
  id: 'u-1',
  email: 'a@b.com',
  password: 'hashed',
  createdAt: now,
  updatedAt: now,
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { create: jest.Mock; findUnique: jest.Mock } };
  let jwt: { signAsync: jest.Mock; verifyAsync: jest.Mock };

  beforeEach(() => {
    prisma = { user: { create: jest.fn(), findUnique: jest.fn() } };
    jwt = { signAsync: jest.fn(), verifyAsync: jest.fn() };
    const config = { get: (_k: string, d: unknown) => (_k === 'BCRYPT_SALT_ROUNDS' ? 4 : d) };
    service = new AuthService(
      prisma as never,
      jwt as unknown as JwtService,
      config as unknown as ConfigService,
    );
  });

  describe('register', () => {
    it('hashes the password and never returns it', async () => {
      prisma.user.create.mockImplementation(({ data }) =>
        Promise.resolve({ ...dbUser, ...data }),
      );
      const result = await service.register({ email: 'A@B.com', password: 'secret123' });
      const stored = prisma.user.create.mock.calls[0][0].data;
      expect(stored.email).toBe('a@b.com');
      expect(stored.password).not.toBe('secret123');
      expect(await bcrypt.compare('secret123', stored.password)).toBe(true);
      expect(result).not.toHaveProperty('password');
    });

    it('throws Conflict on duplicate email', async () => {
      prisma.user.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('dup', {
          code: 'P2002',
          clientVersion: 'x',
        }),
      );
      await expect(
        service.register({ email: 'a@b.com', password: 'secret123' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rethrows unexpected errors', async () => {
      prisma.user.create.mockRejectedValue(new Error('boom'));
      await expect(
        service.register({ email: 'a@b.com', password: 'secret123' }),
      ).rejects.toThrow('boom');
    });
  });

  describe('login', () => {
    it('returns a token for valid credentials', async () => {
      const password = await bcrypt.hash('secret123', 4);
      prisma.user.findUnique.mockResolvedValue({ ...dbUser, password });
      jwt.signAsync.mockResolvedValue('jwt-token');
      const result = await service.login({ email: 'a@b.com', password: 'secret123' });
      expect(result.accessToken).toBe('jwt-token');
      expect(result.user).not.toHaveProperty('password');
      expect(jwt.signAsync).toHaveBeenCalledWith({ sub: 'u-1', email: 'a@b.com' });
    });

    it('rejects a wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...dbUser,
        password: await bcrypt.hash('other', 4),
      });
      await expect(
        service.login({ email: 'a@b.com', password: 'secret123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an unknown email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.login({ email: 'x@y.com', password: 'secret123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('validateToken', () => {
    it('returns the user for a valid token', async () => {
      jwt.verifyAsync.mockResolvedValue({ sub: 'u-1' });
      prisma.user.findUnique.mockResolvedValue(dbUser);
      const result = await service.validateToken('t');
      expect(result.id).toBe('u-1');
      expect(result).not.toHaveProperty('password');
    });

    it('rejects an invalid token', async () => {
      jwt.verifyAsync.mockRejectedValue(new Error('jwt malformed'));
      await expect(service.validateToken('bad')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects when the user no longer exists', async () => {
      jwt.verifyAsync.mockResolvedValue({ sub: 'gone' });
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.validateToken('t')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
