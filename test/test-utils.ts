import * as request from 'supertest';
import { ApolloDriver } from '@nestjs/apollo';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExceptionHandler } from '../src/app.exception';
import { AuthGuard } from '../src/modules/auth/auth.guard';
import { Activity } from '../src/modules/activity/activity.entity';
import { ActivityType } from '../src/modules/types/activity-type.entity';
import { Team } from '../src/modules/teams/team.entity';
import { TeamMember } from '../src/modules/teams/team-member.entity';
import { User } from '../src/modules/users/user.entity';
import { INestApplication } from '@nestjs/common';

export class TestUtils {
  public async getModule(imports: any[], providers: any[]) {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User, Activity, ActivityType, Team, TeamMember],
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
          secret: 'jwt-secret',
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

  private generateAuthToken(userId: string) {
    const payload = { sub: userId };
    return new JwtService().sign(payload, { secret: 'jwt-secret' });
  }

  public async gqlRequest(
    app: INestApplication,
    query: string,
    variables: any,
    userId?: string
  ) {
    const token = this.generateAuthToken(userId || 'user-id');
    return request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send({
        query,
        variables
      });
  }
}
