import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ScheduleService } from './schedule.service';

const input = {
  objective: 'Check-up',
  customerId: 'c-1',
  doctorId: 'd-1',
  scheduledAt: new Date('2026-12-01T09:00:00Z'),
};

describe('ScheduleService', () => {
  let service: ScheduleService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      customer: { findUnique: jest.fn().mockResolvedValue({ id: 'c-1' }) },
      doctor: { findUnique: jest.fn().mockResolvedValue({ id: 'd-1' }) },
      schedule: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 's-1', ...data })),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    };
    service = new ScheduleService(prisma);
  });

  describe('create', () => {
    it('creates a schedule when customer, doctor and slot are valid', async () => {
      const result = await service.create(input);
      expect(result).toMatchObject({ id: 's-1', doctorId: 'd-1' });
      expect(prisma.schedule.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { doctorId: 'd-1', scheduledAt: input.scheduledAt } }),
      );
    });

    it('rejects an unknown customer', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);
      await expect(service.create(input)).rejects.toThrow(new NotFoundException('Customer not found'));
      expect(prisma.schedule.create).not.toHaveBeenCalled();
    });

    it('rejects an unknown doctor', async () => {
      prisma.doctor.findUnique.mockResolvedValue(null);
      await expect(service.create(input)).rejects.toThrow(new NotFoundException('Doctor not found'));
    });

    it('rejects a doctor double-booking', async () => {
      prisma.schedule.findFirst.mockResolvedValue({ id: 'other' });
      await expect(service.create(input)).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.schedule.create).not.toHaveBeenCalled();
    });

    it('maps a unique-index race (P2002) to Conflict', async () => {
      prisma.schedule.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'x' }),
      );
      await expect(service.create(input)).rejects.toBeInstanceOf(ConflictException);
    });

    it('rethrows unexpected errors', async () => {
      prisma.schedule.create.mockRejectedValue(new Error('boom'));
      await expect(service.create(input)).rejects.toThrow('boom');
    });
  });

  describe('findAll', () => {
    it('applies filters and returns pagination info', async () => {
      prisma.schedule.count.mockResolvedValue(25);
      const from = new Date('2026-12-01');
      const to = new Date('2026-12-31');
      const result = await service.findAll({ page: 2, limit: 10, doctorId: 'd-1', from, to });
      expect(prisma.schedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { doctorId: 'd-1', scheduledAt: { gte: from, lte: to } },
          skip: 10,
          take: 10,
        }),
      );
      expect(result).toMatchObject({ total: 25, page: 2, limit: 10, totalPages: 3 });
    });

    it('uses an empty filter when none given', async () => {
      await service.findAll({ page: 1, limit: 10 });
      expect(prisma.schedule.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    });
  });

  describe('findOne / remove', () => {
    it('findOne throws NotFound when missing', async () => {
      prisma.schedule.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('findOne returns the schedule', async () => {
      prisma.schedule.findUnique.mockResolvedValue({ id: 's-1' });
      await expect(service.findOne('s-1')).resolves.toEqual({ id: 's-1' });
    });

    it('remove maps P2025 to NotFound', async () => {
      prisma.schedule.delete.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('nf', { code: 'P2025', clientVersion: 'x' }),
      );
      await expect(service.remove('x')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('remove returns the deleted schedule', async () => {
      prisma.schedule.delete.mockResolvedValue({ id: 's-1' });
      await expect(service.remove('s-1')).resolves.toEqual({ id: 's-1' });
    });

    it('remove rethrows unexpected errors', async () => {
      prisma.schedule.delete.mockRejectedValue(new Error('boom'));
      await expect(service.remove('s-1')).rejects.toThrow('boom');
    });
  });
});
