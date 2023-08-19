import { Module } from '@nestjs/common';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { UserModule } from '../users/user.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    UserModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '60s' }
    })
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    },
    AuthResolver,
    AuthService
  ]
})
export class AuthModule {}
