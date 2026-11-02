import { INestApplication, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthClientService } from './auth/auth-client.service';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

/**
 * Boots the whole GraphQL app with Prisma and the Auth Service mocked, to check
 * that the schema compiles, the global auth guard is enforced and input
 * validation works.
 */
describe('Schedule Service (GraphQL smoke)', () => {
  let app: INestApplication;
  let url: string;
  const prisma = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    customer: {
      findMany: jest.fn().mockResolvedValue([{ id: 'c1', name: 'A', email: 'a@b.c', createdAt: new Date(), updatedAt: new Date() }]),
      count: jest.fn().mockResolvedValue(1),
    },
  };

  beforeAll(async () => {
    process.env.AUTH_SERVICE_URL = 'http://auth.test/graphql';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService).useValue(prisma)
      .overrideProvider(AuthClientService).useValue({
        validateToken: async (t: string) => {
          if (t !== 'good') throw new UnauthorizedException('Invalid or expired token');
          return { id: 'u1', email: 'u@x.y' };
        },
      })
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(0);
    url = `${await app.getUrl()}/graphql`.replace('[::1]', 'localhost');
  });

  afterAll(() => app.close());

  const gql = async (query: string, token?: string) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(token && { authorization: `Bearer ${token}` }) },
      body: JSON.stringify({ query }),
    });
    return res.json() as Promise<any>;
  };

  it('rejects requests without a token', async () => {
    const body = await gql('{ customers { total } }');
    expect(body.errors[0].message).toMatch(/Authorization header/);
  });

  it('rejects an invalid token', async () => {
    const body = await gql('{ customers { total } }', 'nope');
    expect(body.errors[0].message).toBe('Invalid or expired token');
  });

  it('serves paginated customers with a valid token', async () => {
    const body = await gql('{ customers(page: 1, limit: 5) { total totalPages items { id name } } }', 'good');
    expect(body.errors).toBeUndefined();
    expect(body.data.customers).toEqual({ total: 1, totalPages: 1, items: [{ id: 'c1', name: 'A' }] });
  });

  it('validates input (limit max 100)', async () => {
    const body = await gql('{ customers(limit: 1000) { total } }', 'good');
    expect(body.errors).toBeDefined();
  });

  it('rejects a malformed UUID id', async () => {
    const body = await gql('{ doctor(id: "not-a-uuid") { id } }', 'good');
    expect(body.errors[0].message).toMatch(/uuid/i);
  });
});
