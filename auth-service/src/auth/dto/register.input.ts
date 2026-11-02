import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, MaxLength, MinLength } from 'class-validator';

@InputType()
export class RegisterInput {
  @Field({ description: 'Email address, must be unique' })
  @IsEmail()
  email: string;

  @Field({ description: 'Plain password, 8-72 characters (bcrypt limit)' })
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
