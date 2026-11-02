import { UnauthorizedException } from '@nestjs/common';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';

const now = new Date();
const user = { id: 'u-1', email: 'a@b.com', createdAt: now, updatedAt: now };

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let authService: { register: jest.Mock; login: jest.Mock; validateToken: jest.Mock };

  beforeEach(() => {
    authService = { register: jest.fn(), login: jest.fn(), validateToken: jest.fn() };
    resolver = new AuthResolver(authService as unknown as AuthService);
  });

  it('register delegates to AuthService', async () => {
    const input = { email: 'a@b.com', password: 'secret123' };
    authService.register.mockResolvedValue(user);

    await expect(resolver.register(input)).resolves.toBe(user);
    expect(authService.register).toHaveBeenCalledWith(input);
  });

  it('login delegates to AuthService', async () => {
    const input = { email: 'a@b.com', password: 'secret123' };
    const payload = { accessToken: 'jwt', user };
    authService.login.mockResolvedValue(payload);

    await expect(resolver.login(input)).resolves.toBe(payload);
    expect(authService.login).toHaveBeenCalledWith(input);
  });

  it('validateToken delegates to AuthService', async () => {
    authService.validateToken.mockResolvedValue(user);

    await expect(resolver.validateToken('jwt')).resolves.toBe(user);
    expect(authService.validateToken).toHaveBeenCalledWith('jwt');
  });

  it('validateToken propagates Unauthorized for an invalid token', async () => {
    authService.validateToken.mockRejectedValue(new UnauthorizedException());

    await expect(resolver.validateToken('bad')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
