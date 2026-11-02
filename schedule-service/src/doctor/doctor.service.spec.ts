import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DoctorService } from './doctor.service';

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError(code, { code, clientVersion: 'x' });

describe('DoctorService', () => {
  let service: DoctorService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      doctor: {
        create: jest.fn().mockResolvedValue({ id: '1' }),
        update: jest.fn(),
        delete: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    };
    service = new DoctorService(prisma);
  });

  it('creates and lists', async () => {
    await expect(service.create({ name: 'Dr. A' })).resolves.toEqual({ id: '1' });
    await expect(service.findAll({ page: 1, limit: 10 })).resolves.toMatchObject({ total: 0, totalPages: 0 });
  });

  it('update / delete map prisma errors', async () => {
    prisma.doctor.update.mockRejectedValue(prismaError('P2025'));
    await expect(service.update({ id: 'x', name: 'n' })).rejects.toBeInstanceOf(NotFoundException);
    prisma.doctor.delete.mockRejectedValue(prismaError('P2003'));
    await expect(service.remove('x')).rejects.toBeInstanceOf(ConflictException);
    prisma.doctor.delete.mockRejectedValue(new Error('boom'));
    await expect(service.remove('x')).rejects.toThrow('boom');
  });

  it('findOne', async () => {
    prisma.doctor.findUnique.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toBeInstanceOf(NotFoundException);
    prisma.doctor.findUnique.mockResolvedValue({ id: 'x' });
    await expect(service.findOne('x')).resolves.toEqual({ id: 'x' });
  });
});
