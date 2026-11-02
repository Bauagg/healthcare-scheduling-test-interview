import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsInt, Max, Min } from 'class-validator';

@ArgsType()
export class PaginationArgs {
  @Field(() => Int, { defaultValue: 1, description: 'Page number, starting at 1' })
  @IsInt()
  @Min(1)
  page = 1;

  @Field(() => Int, { defaultValue: 10, description: 'Items per page (1-100)' })
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;
}

export const toSkipTake = ({ page, limit }: PaginationArgs) => ({
  skip: (page - 1) * limit,
  take: limit,
});

export const toPageInfo = (total: number, { page, limit }: PaginationArgs) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});
