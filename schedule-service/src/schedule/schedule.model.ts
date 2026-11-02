import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Paginated } from '../common/paginated';
import { Customer } from '../customer/customer.model';
import { Doctor } from '../doctor/doctor.model';

@ObjectType({ description: 'A consultation between a doctor and a customer' })
export class Schedule {
  @Field(() => ID) id: string;
  @Field({ description: 'Purpose of the consultation' }) objective: string;
  @Field(() => ID) customerId: string;
  @Field(() => ID) doctorId: string;
  @Field({ description: 'Consultation start time (ISO 8601)' }) scheduledAt: Date;
  @Field(() => Customer) customer: Customer;
  @Field(() => Doctor) doctor: Doctor;
  @Field() createdAt: Date;
  @Field() updatedAt: Date;
}

@ObjectType()
export class SchedulePage extends Paginated(Schedule) {}
