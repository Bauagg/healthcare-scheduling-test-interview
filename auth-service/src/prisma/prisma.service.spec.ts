import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;
  let connect: jest.SpyInstance;
  let disconnect: jest.SpyInstance;

  beforeEach(() => {
    service = new PrismaService();
    connect = jest.spyOn(service, '$connect').mockResolvedValue();
    disconnect = jest.spyOn(service, '$disconnect').mockResolvedValue();
  });

  it('connects to the database on module init', async () => {
    await service.onModuleInit();
    expect(connect).toHaveBeenCalledTimes(1);
  });

  it('disconnects from the database on module destroy', async () => {
    await service.onModuleDestroy();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
