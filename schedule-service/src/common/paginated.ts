import { Type } from '@nestjs/common';
import { Field, Int, ObjectType } from '@nestjs/graphql';

export interface PaginatedType<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Builds a `<Model>Page` GraphQL type: items + pagination metadata. */
export function Paginated<T>(itemClass: Type<T>): Type<PaginatedType<T>> {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedClass implements PaginatedType<T> {
    @Field(() => [itemClass], { description: 'Items on the requested page' })
    items: T[];

    @Field(() => Int, { description: 'Total number of items matching the query' })
    total: number;

    @Field(() => Int, { description: 'Current page (1-based)' })
    page: number;

    @Field(() => Int, { description: 'Page size' })
    limit: number;

    @Field(() => Int, { description: 'Total number of pages' })
    totalPages: number;
  }
  return PaginatedClass as Type<PaginatedType<T>>;
}
