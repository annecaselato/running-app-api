import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as request from 'supertest';
import { useContainer } from 'class-validator';
import { UserModule } from '../src/modules/users/user.module';
import { User } from '../src/modules/users/user.entity';
import { CreateUserInput } from '../src/modules/users/dto';
import { TestUtils } from './test-utils';

describe('UserResolver E2E', () => {
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

  beforeAll(async () => {
    process.env.JWT_SECRET = 'jwt-secret';
    const module = await new TestUtils().getModule([UserModule], []);

    app = module.createNestApplication();
    userRepository = module.get<Repository<User>>('UserRepository');

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true })
    );

    await app.init();
    useContainer(app.select(UserModule), { fallbackOnErrors: true });
  });

  beforeEach(async () => {
    await userRepository.query(
      'INSERT INTO "user"("id", "name", "email", "password") VALUES ("userid", "User", "user@email.com", "password")'
    );
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await userRepository.query('DELETE FROM user');
  });

  describe('createUser', () => {
    const createUserInput: CreateUserInput = {
      name: 'User',
      email: 'newuser@email.com',
      password: 'Pass123!'
    };

    const query = `
      mutation ($createUserInput: CreateUserInput!) {
        createUser(createUserInput: $createUserInput) {
          id
        }
      }
    `;

    it('should create user if all parameters are valid', async () => {
      // Act
      const response = await gqlRequest(query, { createUserInput });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.createUser.id).toBeTruthy();
    });

    it('should return an error if email is repeated', async () => {
      // Act
      const response = await gqlRequest(query, {
        createUserInput: { ...createUserInput, email: 'user@email.com' }
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual('Email already exists');
    });

    it.each`
      field         | value        | expectedErrorMessage
      ${'name'}     | ${''}        | ${'name should not be empty'}
      ${'email'}    | ${'invalid'} | ${'email must be an email'}
      ${'password'} | ${'123'}     | ${'password is not strong enough'}
    `(
      'should return an error if $field is $value',
      async ({ field, value, expectedErrorMessage }) => {
        // Act
        const response = await gqlRequest(query, {
          createUserInput: {
            ...createUserInput,
            [field]: value
          }
        });

        // Assert
        expect(response.status).toEqual(200);
        expect(response.body.errors[0].message).toEqual(expectedErrorMessage);
      }
    );
  });

  describe('updateUser', () => {
    const updateUserInput = { name: 'Updated User' };

    const updateQuery = `
      mutation ($updateUserInput: UpdateUserInput!) {
        updateUser(updateUserInput: $updateUserInput) {
          name
        }
      }
    `;

    it('should update the authenticated user', async () => {
      // Act
      const response = await gqlRequestWithAuth(
        updateQuery,
        { updateUserInput },
        'userid'
      );

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.updateUser.name).toEqual(updateUserInput.name);
    });
  });

  describe('updateProfile', () => {
    const updateProfileInput = { profile: 'Athlete' };

    const updateQuery = `
      mutation ($updateProfileInput: UpdateProfileInput!) {
        updateProfile(updateProfileInput: $updateProfileInput) {
          id
          name
          email
          profile
        }
      }
    `;

    it('should update the authenticated users profile', async () => {
      // Act
      const response = await gqlRequestWithAuth(
        updateQuery,
        { updateProfileInput },
        'userid'
      );

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.updateProfile.profile).toEqual(
        updateProfileInput.profile
      );
    });

    it('should return an error if profile is invalid', async () => {
      // Act
      const response = await gqlRequestWithAuth(
        updateQuery,
        { updateProfileInput: { profile: 'Invalid' } },
        'userid'
      );

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual(
        'profile must be one of the following values: Athlete, Coach'
      );
      expect(response.body.data).toBeFalsy();
    });
  });

  describe('deleteUser', () => {
    const deleteQuery = `
      mutation {
        deleteUser
      }
    `;

    it('should delete the authenticated user', async () => {
      // Act
      const response = await gqlRequestWithAuth(deleteQuery, {}, 'userid');

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.deleteUser).toBeTruthy();
    });
  });

  describe('me', () => {
    const meQuery = `
      query {
        me {
          name
        }
      }
    `;

    it('should return the authenticated user', async () => {
      // Act
      const response = await gqlRequestWithAuth(meQuery, {}, 'userid');

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.me.name).toBeTruthy();
    });
  });
});
