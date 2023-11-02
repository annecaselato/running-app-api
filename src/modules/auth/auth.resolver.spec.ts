import { Test, TestingModule } from '@nestjs/testing';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { SignInInput, SignInOIDCInput, SignInResponse } from './dto';
import { User } from '../users/user.entity';

describe('AuthResolver', () => {
  let authResolver: AuthResolver;

  const mockUser = {
    id: 'user-id',
    email: 'user@email.com',
    name: 'User'
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        {
          provide: AuthService,
          useFactory: () => ({
            signIn: jest.fn(() => ({
              access_token: 'access-token',
              user: mockUser
            })),
            signInOIDC: jest.fn(() => ({
              access_token: 'access-token',
              user: mockUser
            })),
            updatePassword: jest.fn(() => mockUser)
          })
        }
      ]
    }).compile();

    authResolver = module.get<AuthResolver>(AuthResolver);
  });

  describe('signIn', () => {
    it('should return a SignInResponse', async () => {
      // Arrange
      const signInInput: SignInInput = {
        email: 'user@email.com',
        password: 'pass'
      };

      // Act
      const result: SignInResponse = await authResolver.signIn(signInInput);

      // Assert
      expect(result).toEqual({ access_token: 'access-token', user: mockUser });
    });
  });

  describe('signInOIDC', () => {
    it('should return a SignInResponse', async () => {
      // Arrange
      const input: SignInOIDCInput = {
        token: 'id-token'
      };

      // Act
      const result: SignInResponse = await authResolver.signInOIDC(input);

      // Assert
      expect(result).toEqual({ access_token: 'access-token', user: mockUser });
    });
  });

  describe('updatePassword', () => {
    it('should return the updated user id if password update is successful', async () => {
      // Arrange
      const updatePasswordInput = {
        oldPassword: 'old-pass',
        newPassword: 'new-pass'
      };

      // Act
      const result: string = await authResolver.updatePassword(
        updatePasswordInput,
        mockUser
      );

      // Assert
      expect(result).toEqual(mockUser.id);
    });
  });
});
