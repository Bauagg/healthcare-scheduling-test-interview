import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

@InputType()
export class CreateCustomerInput {
  @Field() @IsNotEmpty() name: string;
  @Field() @IsEmail() email: string;
}

@InputType()
export class UpdateCustomerInput {
  @Field(() => ID) @IsUUID() id: string;
  @Field({ nullable: true }) @IsOptional() @IsNotEmpty() name?: string;
  @Field({ nullable: true }) @IsOptional() @IsEmail() email?: string;
}
