import { Field, ObjectType } from '@nestjs/graphql';
import { User } from './user.model';

@ObjectType({ description: 'Result of a successful login' })
export class AuthPayload {
  @Field({ description: 'JWT access token. Send as "Authorization: Bearer <token>"' })
  accessToken: string;

  @Field(() => User, { description: 'The authenticated user' })
  user: User;
}
