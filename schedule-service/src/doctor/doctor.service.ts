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
import { CreateDoctorInput, UpdateDoctorInput } from './dto/doctor.input';

@Injectable()
export class DoctorService {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateDoctorInput) {
    return this.prisma.doctor.create({ data: input });
  }

  async update({ id, ...data }: UpdateDoctorInput) {
    try {
      return await this.prisma.doctor.update({ where: { id }, data });
    } catch (error) {
      this.rethrow(error);
    }
  }

  async findAll(pagination: PaginationArgs) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.doctor.findMany({
        ...toSkipTake(pagination),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.doctor.count(),
    ]);
    return { items, ...toPageInfo(total, pagination) };
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctor.findUnique({ where: { id } });
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }

  async remove(id: string) {
    try {
      return await this.prisma.doctor.delete({ where: { id } });
    } catch (error) {
      this.rethrow(error);
    }
  }

  private rethrow(error: unknown): never {
    if (isPrismaError(error, 'P2025')) {
      throw new NotFoundException('Doctor not found');
    }
    if (isPrismaError(error, 'P2003')) {
      throw new ConflictException('Doctor still has schedules; delete them first');
    }
    throw error;
  }
}
