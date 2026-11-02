import { ParseUUIDPipe } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateScheduleInput, SchedulesArgs } from './dto/schedule.input';
import { Schedule, SchedulePage } from './schedule.model';
import { ScheduleService } from './schedule.service';

@Resolver(() => Schedule)
export class ScheduleResolver {
  constructor(private readonly service: ScheduleService) {}

  @Mutation(() => Schedule, {
    description:
      'Create a schedule. Fails with Conflict if the doctor already has a schedule at the same time, and NotFound if the customer or doctor does not exist.',
  })
  createSchedule(@Args('input') input: CreateScheduleInput) {
    return this.service.create(input);
  }

  @Query(() => SchedulePage, {
    description: 'List schedules, earliest first. Filter by doctor, customer and/or time range.',
  })
  schedules(@Args() args: SchedulesArgs) {
    return this.service.findAll(args);
  }

  @Query(() => Schedule, { description: 'Get a schedule by ID' })
  schedule(@Args('id', { type: () => ID }, ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Mutation(() => Schedule, { description: 'Delete a schedule' })
  deleteSchedule(@Args('id', { type: () => ID }, ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
