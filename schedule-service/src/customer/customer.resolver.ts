import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ParseUUIDPipe } from '@nestjs/common';
import { PaginationArgs } from '../common/pagination.args';
import { Customer, CustomerPage } from './customer.model';
import { CustomerService } from './customer.service';
import { CreateCustomerInput, UpdateCustomerInput } from './dto/customer.input';

@Resolver(() => Customer)
export class CustomerResolver {
  constructor(private readonly service: CustomerService) {}

  @Mutation(() => Customer, { description: 'Create a new customer' })
  createCustomer(@Args('input') input: CreateCustomerInput) {
    return this.service.create(input);
  }

  @Mutation(() => Customer, { description: 'Update customer name and/or email' })
  updateCustomer(@Args('input') input: UpdateCustomerInput) {
    return this.service.update(input);
  }

  @Query(() => CustomerPage, { description: 'List customers (paginated, newest first)' })
  customers(@Args() pagination: PaginationArgs) {
    return this.service.findAll(pagination);
  }

  @Query(() => Customer, { description: 'Get a customer by ID' })
  customer(@Args('id', { type: () => ID }, ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Mutation(() => Customer, {
    description: 'Delete a customer. Fails if the customer still has schedules.',
  })
  deleteCustomer(@Args('id', { type: () => ID }, ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
