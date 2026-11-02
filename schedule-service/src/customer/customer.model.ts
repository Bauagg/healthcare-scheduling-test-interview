import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Paginated } from '../common/paginated';

@ObjectType({ description: 'A patient / customer who books consultations' })
export class Customer {
  @Field(() => ID) id: string;
  @Field() name: string;
  @Field({ description: 'Unique email address' }) email: string;
  @Field() createdAt: Date;
  @Field() updatedAt: Date;
}

@ObjectType()
export class CustomerPage extends Paginated(Customer) {}
