import { ArgsType, Field, ID, InputType } from '@nestjs/graphql';
import { IsDate, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { PaginationArgs } from '../../common/pagination.args';

@InputType()
export class CreateScheduleInput {
  @Field({ description: 'Purpose of the consultation' })
  @IsNotEmpty()
  objective: string;

  @Field(() => ID) @IsUUID() customerId: string;
  @Field(() => ID) @IsUUID() doctorId: string;

  @Field({ description: 'ISO 8601 date-time, e.g. 2026-12-01T09:00:00Z' })
  @IsDate()
  scheduledAt: Date;
}

@ArgsType()
export class SchedulesArgs extends PaginationArgs {
  @Field(() => ID, { nullable: true, description: 'Only schedules of this doctor' })
  @IsOptional() @IsUUID() doctorId?: string;

  @Field(() => ID, { nullable: true, description: 'Only schedules of this customer' })
  @IsOptional() @IsUUID() customerId?: string;

  @Field({ nullable: true, description: 'scheduledAt >= from' })
  @IsOptional() @IsDate() from?: Date;

  @Field({ nullable: true, description: 'scheduledAt <= to' })
  @IsOptional() @IsDate() to?: Date;
}
