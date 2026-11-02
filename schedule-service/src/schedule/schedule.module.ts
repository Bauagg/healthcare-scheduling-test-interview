import { Module } from '@nestjs/common';
import { ScheduleResolver } from './schedule.resolver';
import { ScheduleService } from './schedule.service';

@Module({ providers: [ScheduleService, ScheduleResolver] })
export class ScheduleModule {}
