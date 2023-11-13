import { Test, TestingModule } from '@nestjs/testing';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { SignInInput, SignInOIDCInput, SignInResponse } from './dto';
import { User } from '../users/user.entity';
import { BadRequestException } from '@nestjs/common';

describe('AuthResolver', () => {
  let authResolver: AuthResolver;
  let authService: AuthService;

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
            updatePassword: jest.fn(() => mockUser),
            requestRecovery: jest.fn(),
            passwordRecovery: jest.fn()
          })
        }
      ]
    }).compile();

    authResolver = module.get(AuthResolver);
    authService = module.get(AuthService);
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

  describe('requestRecovery', () => {
    it('should call authService.requestRecovery with email', async () => {
      // Arrange
      const input = {
        email: 'user@email.com'
      };

      // Act
      const response = await authResolver.requestRecovery(input);

      // Assert
      expect(authService.requestRecovery).toHaveBeenCalledWith(input.email);
      expect(response).toEqual(true);
    });
  });

  describe('resetPassword', () => {
    // Arrange
    const input = {
      token: 'jwt-token',
      password: 'new-pass'
    };

    it('should call authService.passwordRecovery with token and password', async () => {
      // Act
      const response = await authResolver.resetPassword(input);

      // Assert
      expect(authService.passwordRecovery).toHaveBeenCalledWith(
        input.token,
        input.password
      );
      expect(response).toEqual(true);
    });

    it('should return exception if authService.passwordRecovery throws', async () => {
      // Arrange
      jest.spyOn(authService, 'passwordRecovery').mockImplementation(() => {
        throw new BadRequestException('Invalid');
      });

      // Act
      const response = authResolver.resetPassword(input);

      // Assert
      await expect(response).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
