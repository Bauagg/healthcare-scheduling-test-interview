import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PaginationArgs,
  toPageInfo,
  toSkipTake,
} from '../common/pagination.args';
import { isPrismaError } from '../common/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerInput, UpdateCustomerInput } from './dto/customer.input';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateCustomerInput) {
    try {
      return await this.prisma.customer.create({
        data: { ...input, email: input.email.toLowerCase() },
      });
    } catch (error) {
      this.rethrow(error);
    }
  }

  async update({ id, ...data }: UpdateCustomerInput) {
    try {
      return await this.prisma.customer.update({
        where: { id },
        data: { ...data, ...(data.email && { email: data.email.toLowerCase() }) },
      });
    } catch (error) {
      this.rethrow(error);
    }
  }

  async findAll(pagination: PaginationArgs) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        ...toSkipTake(pagination),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count(),
    ]);
    return { items, ...toPageInfo(total, pagination) };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async remove(id: string) {
    try {
      return await this.prisma.customer.delete({ where: { id } });
    } catch (error) {
      this.rethrow(error);
    }
  }

  private rethrow(error: unknown): never {
    if (isPrismaError(error, 'P2002')) {
      throw new ConflictException('Customer email is already used');
    }
    if (isPrismaError(error, 'P2025')) {
      throw new NotFoundException('Customer not found');
    }
    if (isPrismaError(error, 'P2003')) {
      throw new ConflictException(
        'Customer still has schedules; delete them first',
      );
    }
    throw error;
  }
}
