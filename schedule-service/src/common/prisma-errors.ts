import { Prisma } from '@prisma/client';

export const isPrismaError = (
  error: unknown,
  code: 'P2002' | 'P2003' | 'P2025',
): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
