import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'A registered user. The password hash is never exposed.' })
export class User {
  @Field(() => ID, { description: 'Unique identifier (UUID)' })
  id: string;

  @Field({ description: 'Unique email address' })
  email: string;

  @Field({ description: 'Creation timestamp' })
  createdAt: Date;

  @Field({ description: 'Last update timestamp' })
  updatedAt: Date;
}
