import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty } from 'class-validator';

@InputType()
export class LoginInput {
  @Field({ description: 'Registered email address' })
  @IsEmail()
  email: string;

  @Field({ description: 'Account password' })
  @IsNotEmpty()
  password: string;
}
