import { ParseUUIDPipe } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PaginationArgs } from '../common/pagination.args';
import { CreateDoctorInput, UpdateDoctorInput } from './dto/doctor.input';
import { Doctor, DoctorPage } from './doctor.model';
import { DoctorService } from './doctor.service';

@Resolver(() => Doctor)
export class DoctorResolver {
  constructor(private readonly service: DoctorService) {}

  @Mutation(() => Doctor, { description: 'Create a new doctor' })
  createDoctor(@Args('input') input: CreateDoctorInput) {
    return this.service.create(input);
  }

  @Mutation(() => Doctor, { description: 'Update doctor name' })
  updateDoctor(@Args('input') input: UpdateDoctorInput) {
    return this.service.update(input);
  }

  @Query(() => DoctorPage, { description: 'List doctors (paginated, newest first)' })
  doctors(@Args() pagination: PaginationArgs) {
    return this.service.findAll(pagination);
  }

  @Query(() => Doctor, { description: 'Get a doctor by ID' })
  doctor(@Args('id', { type: () => ID }, ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Mutation(() => Doctor, {
    description: 'Delete a doctor. Fails if the doctor still has schedules.',
  })
  deleteDoctor(@Args('id', { type: () => ID }, ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
