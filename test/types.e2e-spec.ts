import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApolloDriver } from '@nestjs/apollo';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { Repository } from 'typeorm';
import * as request from 'supertest';
import { useContainer } from 'class-validator';
import { ActivityType } from '../src/modules/types/activity-type.entity';
import { TypeModule } from '../src/modules/types/type.module';
import { AuthGuard } from '../src/modules/auth/auth.guard';
import { ExceptionHandler } from '../src/app.exception';
import { CreateTypeInput } from '../src/modules/types/dto';
import { Activity } from '../src/modules/activity/activity.entity';
import { User } from '../src/modules/users/user.entity';
import { UserModule } from '../src/modules/users/user.module';

describe('TypeResolver E2E', () => {
  let app: INestApplication;
  let typeRepository: Repository<ActivityType>;
  let userRepository: Repository<User>;

  const generateAuthToken = (userId: string) => {
    const payload = { sub: userId, email: 'user@email.com', name: 'Test User' };
    return new JwtService().sign(payload, { secret: 'jwt-secret' });
  };

  const gqlRequestWithAuth = async (query: string, variables: any) => {
    const token = generateAuthToken('user-id');
    return request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send({
        query,
        variables
      });
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'jwt-secret';
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeModule,
        UserModule,
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [ActivityType, Activity, User],
          logging: true,
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
        })
      ],
      providers: [
        {
          provide: APP_GUARD,
          useClass: AuthGuard
        }
      ]
    }).compile();

    app = module.createNestApplication();

    typeRepository = module.get<Repository<ActivityType>>(
      'ActivityTypeRepository'
    );
    userRepository = module.get<Repository<User>>('UserRepository');

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true })
    );

    await app.init();
    useContainer(app.select(TypeModule), { fallbackOnErrors: true });
  });

  beforeEach(async () => {
    // Arrange
    await userRepository.query(
      'INSERT INTO "user"("id", "name", "email", "createdAt", "updatedAt") VALUES ("user-id", "User", "user@email.com", datetime("now"), datetime("now"))'
    );

    await userRepository.query(
      'INSERT INTO "activity_type"("id", "type", "description", "userId") VALUES ("1e2e860e-befa-4407-83dd-84fa1d2b1e62", "New Run", null, "user-id")'
    );
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await typeRepository.query('DELETE FROM activity_type');
    await userRepository.query('DELETE FROM user');
  });

  describe('createType', () => {
    const createTypeInput: CreateTypeInput = {
      type: 'Run',
      description: 'Easy pace run.'
    };

    const query = `
      mutation ($createTypeInput: CreateTypeInput!) {
        createType(createTypeInput: $createTypeInput) {
          id
        }
      }
    `;

    it('should create type if all parameters are valid', async () => {
      // Act
      const response = await gqlRequestWithAuth(query, { createTypeInput });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.createType.id).toBeTruthy();
    });

    it('should return an error if the type already exist', async () => {
      // Act
      const response = await gqlRequestWithAuth(query, {
        createTypeInput: {
          type: 'New Run',
          description: 'Easy pace run.'
        }
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual('Type already exist');
    });

    it.each`
      field            | value | expectedErrorMessage
      ${'type'}        | ${''} | ${'type should not be empty'}
      ${'description'} | ${''} | ${'description should not be empty'}
    `(
      'should return an error if $field is $value',
      async ({ field, value, expectedErrorMessage }) => {
        // Act
        const response = await gqlRequestWithAuth(query, {
          createTypeInput: {
            ...createTypeInput,
            [field]: value
          }
        });

        // Assert
        expect(response.status).toEqual(200);
        expect(response.body.errors[0].message).toEqual(expectedErrorMessage);
      }
    );
  });

  describe('updateType', () => {
    const updateTypeInput = {
      id: '1e2e860e-befa-4407-83dd-84fa1d2b1e62',
      type: 'UpdatedType',
      description: 'Updated description'
    };

    const query = `
      mutation ($updateTypeInput: UpdateTypeInput!) {
        updateType(updateTypeInput: $updateTypeInput) {
          id
          type
          description
        }
      }
    `;

    it('should update a type if all parameters are valid', async () => {
      // Act
      const response = await gqlRequestWithAuth(query, { updateTypeInput });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      const updatedType = response.body.data.updateType;
      expect(updatedType.id).toBeTruthy();
      expect(updatedType.type).toEqual('UpdatedType');
      expect(updatedType.description).toEqual('Updated description');
    });

    it('should return an error if the type does not exist', async () => {
      const nonExistentId = '1e2e860e-befa-4407-83dd-84fa1d2b1e63';

      // Act
      const response = await gqlRequestWithAuth(query, {
        updateTypeInput: { ...updateTypeInput, id: nonExistentId }
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual('Type not found');
    });
  });

  describe('deleteType', () => {
    const deleteTypeInput = {
      id: '1e2e860e-befa-4407-83dd-84fa1d2b1e62'
    };

    const query = `
      mutation ($deleteTypeInput: GetTypeInput!) {
        deleteType(deleteTypeInput: $deleteTypeInput)
      }
    `;

    it('should delete a type if it exists', async () => {
      // Act
      const response = await gqlRequestWithAuth(query, { deleteTypeInput });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      const deletedTypeId = response.body.data.deleteType;
      expect(deletedTypeId).toEqual('1e2e860e-befa-4407-83dd-84fa1d2b1e62');
    });

    it('should not return an error if the type does not exist', async () => {
      const nonExistentId = '1e2e860e-befa-4407-83dd-84fa1d2b1e63';

      // Act
      const response = await gqlRequestWithAuth(query, {
        deleteTypeInput: { id: nonExistentId }
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
    });
  });

  describe('getType', () => {
    const getTypeInput = {
      id: '1e2e860e-befa-4407-83dd-84fa1d2b1e62'
    };

    const query = `
      query ($getTypeInput: GetTypeInput!) {
        getType(getTypeInput: $getTypeInput) {
          id
          type
          description
        }
      }
    `;

    it('should return the type if it exists', async () => {
      // Act
      const response = await gqlRequestWithAuth(query, { getTypeInput });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      const type = response.body.data.getType;
      expect(type).toBeTruthy();
    });

    it('should return error if the type is not found', async () => {
      const nonExistentId = '1e2e860e-befa-4407-83dd-84fa1d2b1e63';

      // Act
      const response = await gqlRequestWithAuth(query, {
        getTypeInput: { id: nonExistentId }
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual('Type not found');
    });
  });

  describe('listTypes', () => {
    const query = `
      query {
        listTypes {
          id
          type
          description
        }
      }
    `;

    it('should return a list of types', async () => {
      // Act
      const response = await gqlRequestWithAuth(query, {});

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      const types = response.body.data.listTypes;
      expect(types).toBeTruthy();
    });
  });
});
