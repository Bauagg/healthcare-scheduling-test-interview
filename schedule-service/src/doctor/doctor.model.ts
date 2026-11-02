import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Paginated } from '../common/paginated';

@ObjectType({ description: 'A doctor who receives consultations' })
export class Doctor {
  @Field(() => ID) id: string;
  @Field() name: string;
  @Field() createdAt: Date;
  @Field() updatedAt: Date;
}

@ObjectType()
export class DoctorPage extends Paginated(Doctor) {}
