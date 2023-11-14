import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { useContainer } from 'class-validator';
import { Repository } from 'typeorm';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from '../src/modules/users/user.entity';
import {
  RequestRecoveryInput,
  ResetPasswordInput,
  UpdatePasswordInput
} from '../src/modules/auth/dto';
import { UserModule } from '../src/modules/users/user.module';
import { AuthResolver } from '../src/modules/auth/auth.resolver';
import { AuthService } from '../src/modules/auth/auth.service';
import { TestUtils } from './test-utils';

describe('AuthResolver E2E', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let mailerService: MailerService;
  let jwtService: JwtService;

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

    const module = await new TestUtils().getModule(
      [UserModule],
      [
        AuthResolver,
        AuthService,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn()
          }
        }
      ]
    );

    app = module.createNestApplication();

    userRepository = module.get('UserRepository');
    mailerService = module.get(MailerService);
    jwtService = module.get(JwtService);

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true })
    );

    await app.init();
    useContainer(app.select(UserModule), { fallbackOnErrors: true });
  });

  beforeEach(async () => {
    // Arrange
    const passHash = await bcrypt.hash('Pass123!', 10);
    await userRepository.query(
      'INSERT INTO "user"("id", "name", "email", "password") VALUES ("userid", "User", "user@email.com", $1)',
      [passHash]
    );
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await userRepository.query('DELETE FROM user');
    jest.clearAllMocks();
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
      expect(response.body.errors[0].message).toEqual('Unauthorized access');
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
      expect(response.body.errors[0].message).toEqual('Unauthorized access');
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

  describe('requestRecovery', () => {
    const input: RequestRecoveryInput = {
      email: 'user@email.com'
    };

    const query = `
      mutation ($input: RequestRecoveryInput!) {
        requestRecovery(requestRecoveryInput: $input)
      }
    `;

    it('should return true if user exists', async () => {
      // Act
      const response = await gqlRequest(query, { input });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.requestRecovery).toEqual(true);
      expect(mailerService.sendMail).toHaveBeenCalled();
    });

    it('should return true if user does not exists', async () => {
      // Act
      const response = await gqlRequest(query, {
        input: { email: 'other@email.com' }
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.requestRecovery).toEqual(true);
      expect(mailerService.sendMail).not.toHaveBeenCalled();
    });

    it('should return an error if input is invalid', async () => {
      // Act
      const response = await gqlRequest(query, {
        input: { email: '' }
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeTruthy();
      expect(response.body.data).toBeFalsy();
      expect(mailerService.sendMail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const token = new JwtService().sign(
      { sub: 'userid' },
      { secret: 'jwt-secret' }
    );

    const input: ResetPasswordInput = {
      token,
      password: 'NewPass1!'
    };

    const query = `
      mutation ($input: ResetPasswordInput!) {
        resetPassword(resetPasswordInput: $input)
      }
    `;

    it('should return true if input is valid', async () => {
      // Act
      const response = await gqlRequest(query, { input });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.resetPassword).toEqual(true);
    });

    it.each`
      field         | value
      ${'token'}    | ${'invalid'}
      ${'password'} | ${'invalid'}
    `(
      'should return an error if $field is incorrect',
      async ({ field, value }) => {
        // Act
        const response = await gqlRequest(query, {
          input: {
            ...input,
            [field]: value
          }
        });

        // Assert
        expect(response.status).toEqual(200);
        expect(response.body.errors).toBeTruthy();
        expect(response.body.data).toBeFalsy();
      }
    );

    it('should return return an error if token is invalid', async () => {
      // Arrange
      jest.spyOn(jwtService, 'verify').mockImplementationOnce(() => {
        throw new Error('invalid');
      });

      // Act
      const response = await gqlRequest(query, { input });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual('Invalid token');
      expect(response.body.data).toBeFalsy();
    });

    it('should return an error if user is not found', async () => {
      // Arrange
      const token = new JwtService().sign(
        { sub: 'otherid' },
        { secret: 'jwt-secret' }
      );

      // Act
      const response = await gqlRequest(query, {
        input: { ...input, token }
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual('Invalid token');
      expect(response.body.data).toBeFalsy();
    });
  });
});
