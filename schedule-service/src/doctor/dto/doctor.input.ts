import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

@InputType()
export class CreateDoctorInput {
  @Field() @IsNotEmpty() name: string;
}

@InputType()
export class UpdateDoctorInput {
  @Field(() => ID) @IsUUID() id: string;
  @Field({ nullable: true }) @IsOptional() @IsNotEmpty() name?: string;
}
