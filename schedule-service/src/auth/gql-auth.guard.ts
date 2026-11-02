import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthClientService } from './auth-client.service';

/**
 * Registered as a global guard: every query/mutation requires a valid
 * `Authorization: Bearer <token>` header, verified against the Auth Service.
 */
@Injectable()
export class GqlAuthGuard implements CanActivate {
  constructor(private readonly authClient: AuthClientService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context).getContext();
    const header: string | undefined = ctx.req?.headers?.authorization;

    const [scheme, token] = header?.split(' ') ?? [];
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Missing or malformed Authorization header');
    }

    ctx.req.user = await this.authClient.validateToken(token);
    return true;
  }
}
