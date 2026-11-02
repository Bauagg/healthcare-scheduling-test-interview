import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthClientService } from './auth-client.service';
import { GqlAuthGuard } from './gql-auth.guard';

@Global()
@Module({
  providers: [
    AuthClientService,
    { provide: APP_GUARD, useClass: GqlAuthGuard },
  ],
  exports: [AuthClientService],
})
export class AuthModule {}
