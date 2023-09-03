import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { useContainer } from 'class-validator';
import { HealthModule } from '../src/modules/health/health.module';

describe('Health E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        HealthModule,
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          include: [HealthModule],
          autoSchemaFile: true
        })
      ]
    }).compile();

    app = module.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true })
    );

    await app.init();
    useContainer(app.select(HealthModule), { fallbackOnErrors: true });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('chechHealth', () => {
    it('should return 200', async () => {
      //Act
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: `{ checkHealth }` });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.data).toEqual({ checkHealth: 'OK' });
    });
  });
});
