import { ApolloDriver } from '@nestjs/apollo';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExceptionHandler } from '../src/app.exception';
import { AuthGuard } from '../src/modules/auth/auth.guard';
import { Activity } from '../src/modules/activity/activity.entity';
import { ActivityType } from '../src/modules/activity/activity-type.entity';
import { User } from '../src/modules/users/user.entity';

export class TestUtils {
  public async getModule(imports: any[], providers: any[]) {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User, Activity, ActivityType],
          logging: false,
          synchronize: true
        }),
        GraphQLModule.forRoot({
          driver: ApolloDriver,
          autoSchemaFile: true,
          formatError: ExceptionHandler.formatApolloError
        }),
        JwtModule.register({
          global: true,
          secret: process.env.JWT_SECRET,
          signOptions: { expiresIn: '500s' }
        }),
        ...imports
      ],
      providers: [
        {
          provide: APP_GUARD,
          useClass: AuthGuard
        },
        ...providers
      ]
    }).compile();

    return module;
  }
}
