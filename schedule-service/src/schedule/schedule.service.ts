import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { toPageInfo, toSkipTake } from '../common/pagination.args';
import { isPrismaError } from '../common/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleInput, SchedulesArgs } from './dto/schedule.input';

const WITH_RELATIONS = { customer: true, doctor: true } as const;

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async create({ customerId, doctorId, scheduledAt, objective }: CreateScheduleInput) {
    const [customer, doctor] = await Promise.all([
      this.prisma.customer.findUnique({ where: { id: customerId }, select: { id: true } }),
      this.prisma.doctor.findUnique({ where: { id: doctorId }, select: { id: true } }),
    ]);
    if (!customer) throw new NotFoundException('Customer not found');
    if (!doctor) throw new NotFoundException('Doctor not found');

    const clash = await this.prisma.schedule.findFirst({
      where: { doctorId, scheduledAt },
      select: { id: true },
    });
    if (clash) throw this.conflict();

    try {
      return await this.prisma.schedule.create({
        data: { customerId, doctorId, scheduledAt, objective },
        include: WITH_RELATIONS,
      });
    } catch (error) {
      // Two concurrent requests can both pass the check above; the unique
      // index (doctorId, scheduledAt) is the final safeguard.
      if (isPrismaError(error, 'P2002')) throw this.conflict();
      throw error;
    }
  }

  async findAll(args: SchedulesArgs) {
    const { doctorId, customerId, from, to } = args;
    const where: Prisma.ScheduleWhereInput = {
      ...(doctorId && { doctorId }),
      ...(customerId && { customerId }),
      ...((from || to) && {
        scheduledAt: { ...(from && { gte: from }), ...(to && { lte: to }) },
      }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.schedule.findMany({
        where,
        include: WITH_RELATIONS,
        orderBy: { scheduledAt: 'asc' },
        ...toSkipTake(args),
      }),
      this.prisma.schedule.count({ where }),
    ]);
    return { items, ...toPageInfo(total, args) };
  }

  async findOne(id: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: WITH_RELATIONS,
    });
    if (!schedule) throw new NotFoundException('Schedule not found');
    return schedule;
  }

  async remove(id: string) {
    try {
      return await this.prisma.schedule.delete({
        where: { id },
        include: WITH_RELATIONS,
      });
    } catch (error) {
      if (isPrismaError(error, 'P2025')) {
        throw new NotFoundException('Schedule not found');
      }
      throw error;
    }
  }

  private conflict() {
    return new ConflictException(
      'Doctor already has a schedule at that time',
    );
  }
}
