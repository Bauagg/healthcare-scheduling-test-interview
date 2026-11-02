import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AuthUser {
  id: string;
  email: string;
}

const VALIDATE_TOKEN_QUERY = `
  query ValidateToken($token: String!) {
    validateToken(token: $token) { id email }
  }
`;

/** Thin GraphQL client for the Auth Service `validateToken` query. */
@Injectable()
export class AuthClientService {
  private readonly logger = new Logger(AuthClientService.name);
  private readonly url: string;

  constructor(config: ConfigService) {
    this.url = config.getOrThrow<string>('AUTH_SERVICE_URL');
  }

  async validateToken(token: string): Promise<AuthUser> {
    let response: Response;
    try {
      response = await fetch(this.url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: VALIDATE_TOKEN_QUERY,
          variables: { token },
        }),
        signal: AbortSignal.timeout(5000),
      });
    } catch (error) {
      this.logger.error(`Auth Service unreachable: ${(error as Error).message}`);
      throw new ServiceUnavailableException('Auth Service is unavailable');
    }

    const body = (await response.json().catch(() => null)) as {
      data?: { validateToken?: AuthUser | null };
      errors?: unknown[];
    } | null;

    const user = body?.data?.validateToken;
    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}
