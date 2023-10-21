import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApolloDriver } from '@nestjs/apollo';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { useContainer } from 'class-validator';
import { Repository } from 'typeorm';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { User } from '../src/modules/users/user.entity';
import { UpdatePasswordInput } from '../src/modules/auth/dto';
import { UserModule } from '../src/modules/users/user.module';
import { AuthGuard } from '../src/modules/auth/auth.guard';
import { AuthResolver } from '../src/modules/auth/auth.resolver';
import { AuthService } from '../src/modules/auth/auth.service';
import { Activity } from '../src/modules/activity/activity.entity';
import { ActivityType } from '../src/modules/activity/activity-type.entity';

describe('AuthResolver E2E', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  const gqlRequest = async (query: string, variables: any) => {
    return request(app.getHttpServer()).post('/graphql').send({
      query,
      variables
    });
  };

  const generateAuthToken = (userId: string) => {
    const payload = { sub: userId, email: 'user@email.com', name: 'Test User' };
    return new JwtService().sign(payload, { secret: 'jwt-secret' });
  };

  const gqlRequestWithAuth = async (
    query: string,
    variables: any,
    userId: string
  ) => {
    const token = generateAuthToken(userId);
    return request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send({
        query,
        variables
      });
  };

  const gqlRequestWithInvalidAuth = async (query: string, variables: any) => {
    return request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer invalid`)
      .send({
        query,
        variables
      });
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'jwt-secret';

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
          autoSchemaFile: true
        }),
        JwtModule.register({
          global: true,
          secret: process.env.JWT_SECRET,
          signOptions: { expiresIn: '500s' }
        }),
        UserModule
      ],
      providers: [
        {
          provide: APP_GUARD,
          useClass: AuthGuard
        },
        AuthResolver,
        AuthService
      ]
    }).compile();

    app = module.createNestApplication();
    userRepository = module.get<Repository<User>>('UserRepository');

    await app.init();
    useContainer(app.select(UserModule), { fallbackOnErrors: true });
  });

  beforeEach(async () => {
    // Arrange
    const passHash = await bcrypt.hash('Pass123!', 10);
    await userRepository.query(
      'INSERT INTO "user"("id", "name", "email", "password", "createdAt", "updatedAt") VALUES ("userid", "User", "user@email.com", $1, datetime("now"), datetime("now"))',
      [passHash]
    );
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await userRepository.query('DELETE FROM user');
  });

  describe('signIn', () => {
    const signInInput = {
      email: 'user@email.com',
      password: 'Pass123!'
    };

    const signInQuery = `
      mutation ($signInInput: SignInInput!) {
        signIn(signInInput: $signInInput) {
          access_token
          user {
            id
            email
            name
          }
        }
      }
    `;

    it('should sign in the user and return access token', async () => {
      // Act
      const response = await gqlRequest(signInQuery, { signInInput });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.signIn.access_token).toBeTruthy();
      expect(response.body.data.signIn.user).toBeTruthy();
      expect(response.body.data.signIn.user.id).toBeTruthy();
      expect(response.body.data.signIn.user.email).toBe(signInInput.email);
      expect(response.body.data.signIn.user.name).toBeTruthy();
    });

    it.each`
      field         | value
      ${'email'}    | ${'invalid@email.com'}
      ${'password'} | ${'WrongPass123!'}
    `(
      'should return an error if $field is incorrect',
      async ({ field, value }) => {
        // Act
        const response = await gqlRequest(signInQuery, {
          signInInput: {
            ...signInInput,
            [field]: value
          }
        });

        // Assert
        expect(response.status).toEqual(200);
        expect(response.body.errors[0].message).toEqual(
          'Wrong email or password'
        );
      }
    );
  });

  describe('signInOIDC', () => {
    const signInOIDCInput = {
      token: 'ID token '
    };

    const signInOIDCQuery = `
      mutation ($signInOIDCInput: SignInOIDCInput!) {
        signInOIDC(signInOIDCInput: $signInOIDCInput) {
          access_token
          user {
            id
            email
            name
          }
        }
      }
    `;

    it('should sign in the user and return access token', async () => {
      // Arrange
      jest
        .spyOn(jwt, 'verify')
        .mockImplementation((_token, _getKey, _options, callback) => {
          const mockPayload = { name: 'User Name', email: 'user@email.com' };
          if (callback) {
            callback(null, mockPayload);
          }
        });

      // Act
      const response = await gqlRequest(signInOIDCQuery, { signInOIDCInput });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.signInOIDC.access_token).toBeTruthy();
      expect(response.body.data.signInOIDC.user).toBeTruthy();
      expect(response.body.data.signInOIDC.user.id).toBeTruthy();
      expect(response.body.data.signInOIDC.user.email).toBeTruthy();
      expect(response.body.data.signInOIDC.user.name).toBeTruthy();
    });

    it('should create the user if it does not exist', async () => {
      // Arrange
      jest
        .spyOn(jwt, 'verify')
        .mockImplementation((_token, _getKey, _options, callback) => {
          const mockPayload = { name: 'New User', email: 'newuser@email.com' };
          if (callback) {
            callback(null, mockPayload);
          }
        });

      // Act
      const response = await gqlRequest(signInOIDCQuery, { signInOIDCInput });

      // Assert
      const newUser = await userRepository.query(
        'SELECT id, name, email FROM "user" WHERE email = "newuser@email.com"'
      );
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(newUser).toBeTruthy();
    });

    it('should return error if ID token is invalid', async () => {
      // Arrange
      jest
        .spyOn(jwt, 'verify')
        .mockImplementation((_token, _getKey, _options, callback) => {
          if (callback) {
            callback(new Error('invalid') as jwt.VerifyErrors, null);
          }
        });

      // Act
      const response = await gqlRequest(signInOIDCQuery, { signInOIDCInput });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeTruthy();
      expect(response.body.data).toBeFalsy();
    });
  });

  describe('updatePassword', () => {
    const updatePasswordInput: UpdatePasswordInput = {
      oldPassword: 'Pass123!',
      newPassword: 'NewPass456!'
    };

    const updatePasswordQuery = `
      mutation ($updatePasswordInput: UpdatePasswordInput!) {
        updatePassword(updatePasswordInput: $updatePasswordInput)
      }
    `;

    it('should update the password of the authenticated user', async () => {
      // Act
      const response = await gqlRequestWithAuth(
        updatePasswordQuery,
        { updatePasswordInput },
        'userid'
      );

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.updatePassword).toBeTruthy();
    });

    it('should return an error if user is not authenticated', async () => {
      // Act
      const response = await gqlRequest(updatePasswordQuery, {
        updatePasswordInput
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual('Invalid access token');
    });

    it('should return an error if auth token is invalid is not authenticated', async () => {
      // Act
      const response = await gqlRequestWithInvalidAuth(updatePasswordQuery, {
        updatePasswordInput
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual('Invalid access token');
    });

    it('should return an error if user is not found', async () => {
      // Act
      const response = await gqlRequestWithAuth(
        updatePasswordQuery,
        { updatePasswordInput },
        'invalid-userid'
      );

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual('Invalid access token');
    });

    it('should return an error if the old password is incorrect', async () => {
      // Act
      const response = await gqlRequestWithAuth(
        updatePasswordQuery,
        {
          updatePasswordInput: {
            oldPassword: 'WrongOldPass',
            newPassword: 'NewPass456!'
          }
        },
        'userid'
      );

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual('Wrong password');
    });
  });
});
