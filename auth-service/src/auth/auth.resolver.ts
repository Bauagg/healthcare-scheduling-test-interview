import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginInput } from './dto/login.input';
import { RegisterInput } from './dto/register.input';
import { AuthPayload } from './models/auth-payload.model';
import { User } from './models/user.model';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => User, { description: 'Register a new user with email and password' })
  register(@Args('input') input: RegisterInput) {
    return this.authService.register(input);
  }

  @Mutation(() => AuthPayload, { description: 'Login and receive a JWT access token' })
  login(@Args('input') input: LoginInput) {
    return this.authService.login(input);
  }

  @Query(() => User, {
    description:
      'Validate a JWT and return the user it belongs to. Used by other services; fails with Unauthorized when the token is invalid or expired.',
  })
  validateToken(@Args('token') token: string) {
    return this.authService.validateToken(token);
  }
}
