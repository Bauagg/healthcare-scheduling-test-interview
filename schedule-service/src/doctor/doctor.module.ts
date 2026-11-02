import { Module } from '@nestjs/common';
import { DoctorResolver } from './doctor.resolver';
import { DoctorService } from './doctor.service';

@Module({ providers: [DoctorService, DoctorResolver] })
export class DoctorModule {}
