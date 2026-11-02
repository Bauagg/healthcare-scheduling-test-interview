import {
  ExecutionContext,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthClientService } from './auth-client.service';
import { GqlAuthGuard } from './gql-auth.guard';

describe('AuthClientService', () => {
  const config = { getOrThrow: () => 'http://auth/graphql' } as unknown as ConfigService;
  const client = new AuthClientService(config);
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('returns the user on success and posts the token as a variable', async () => {
    fetchMock.mockResolvedValue({ json: async () => ({ data: { validateToken: { id: 'u', email: 'a@b.c' } } }) });
    await expect(client.validateToken('tok')).resolves.toEqual({ id: 'u', email: 'a@b.c' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://auth/graphql');
    expect(JSON.parse(init.body).variables).toEqual({ token: 'tok' });
  });

  it('throws Unauthorized when auth service returns errors', async () => {
    fetchMock.mockResolvedValue({ json: async () => ({ errors: [{ message: 'Unauthorized' }], data: null }) });
    await expect(client.validateToken('bad')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws Unauthorized on a non-JSON response', async () => {
    fetchMock.mockResolvedValue({ json: async () => { throw new Error('bad json'); } });
    await expect(client.validateToken('bad')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws ServiceUnavailable when auth service is unreachable', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(client.validateToken('t')).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});

describe('GqlAuthGuard', () => {
  const validateToken = jest.fn();
  const guard = new GqlAuthGuard({ validateToken } as unknown as AuthClientService);

  const contextWith = (authorization?: string) => {
    const req: any = { headers: { authorization } };
    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({ getContext: () => ({ req }) } as never);
    return { ctx: {} as ExecutionContext, req };
  };

  beforeEach(() => validateToken.mockReset());

  it('allows a valid bearer token and attaches the user', async () => {
    validateToken.mockResolvedValue({ id: 'u' });
    const { ctx, req } = contextWith('Bearer abc');
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(validateToken).toHaveBeenCalledWith('abc');
    expect(req.user).toEqual({ id: 'u' });
  });

  it.each([undefined, 'abc', 'Basic abc', 'Bearer'])('rejects header %p', async (header) => {
    const { ctx } = contextWith(header);
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(validateToken).not.toHaveBeenCalled();
  });

  it('propagates auth service rejection', async () => {
    validateToken.mockRejectedValue(new UnauthorizedException());
    const { ctx } = contextWith('Bearer bad');
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
