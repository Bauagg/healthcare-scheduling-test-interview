import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CustomerService } from './customer.service';

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError(code, { code, clientVersion: 'x' });

describe('CustomerService', () => {
  let service: CustomerService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      customer: {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([{ id: '1' }]),
        count: jest.fn().mockResolvedValue(1),
      },
      $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    };
    service = new CustomerService(prisma);
  });

  it('lower-cases email on create', async () => {
    prisma.customer.create.mockResolvedValue({ id: '1' });
    await service.create({ name: 'A', email: 'A@B.COM' });
    expect(prisma.customer.create).toHaveBeenCalledWith({ data: { name: 'A', email: 'a@b.com' } });
  });

  it('maps duplicate email to Conflict', async () => {
    prisma.customer.create.mockRejectedValue(prismaError('P2002'));
    await expect(service.create({ name: 'A', email: 'a@b.com' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('update maps P2025 to NotFound and lower-cases email', async () => {
    prisma.customer.update.mockResolvedValue({ id: '1' });
    await service.update({ id: '1', email: 'X@Y.com' });
    expect(prisma.customer.update).toHaveBeenCalledWith({ where: { id: '1' }, data: { email: 'x@y.com' } });
    prisma.customer.update.mockRejectedValue(prismaError('P2025'));
    await expect(service.update({ id: '2', name: 'n' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('delete maps FK violation to Conflict', async () => {
    prisma.customer.delete.mockRejectedValue(prismaError('P2003'));
    await expect(service.remove('1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('delete rethrows unknown errors', async () => {
    prisma.customer.delete.mockRejectedValue(new Error('boom'));
    await expect(service.remove('1')).rejects.toThrow('boom');
  });

  it('paginates', async () => {
    const res = await service.findAll({ page: 3, limit: 5 });
    expect(prisma.customer.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 5 }));
    expect(res).toMatchObject({ items: [{ id: '1' }], total: 1, totalPages: 1 });
  });

  it('findOne throws NotFound', async () => {
    prisma.customer.findUnique.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toBeInstanceOf(NotFoundException);
    prisma.customer.findUnique.mockResolvedValue({ id: 'x' });
    await expect(service.findOne('x')).resolves.toEqual({ id: 'x' });
  });
});
