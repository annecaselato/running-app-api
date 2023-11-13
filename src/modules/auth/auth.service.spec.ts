import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserService } from '../users/user.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { User } from '../users/user.entity';
import * as jwt from 'jsonwebtoken';
import { MailerService } from '@nestjs-modules/mailer';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let jwtService: JwtService;
  let mailerService: MailerService;

  const mockUser = {
    id: 'user-id',
    email: 'user@email.com',
    name: 'User',
    password: 'pass-hash'
  } as User;

  const mockCredentials = {
    email: 'user@email.com',
    password: 'pass'
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            create: jest.fn(() => Promise.resolve(mockUser)),
            findOneByEmail: jest.fn(() => Promise.resolve(mockUser)),
            findOneById: jest.fn(() => Promise.resolve(mockUser)),
            updatePassword: jest.fn(() => Promise.resolve(mockUser))
          }
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(() => 'access-token'),
            verify: jest.fn(() => ({
              sub: 'user-id'
            }))
          }
        },
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn()
          }
        }
      ]
    }).compile();

    authService = module.get(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
    mailerService = module.get(MailerService);
  });

  it('auth service should be defined', () => {
    expect(authService).toBeDefined();
  });

  it('user service should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('signIn', () => {
    it('should return access token if successful', async () => {
      // Arrange
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      const jwtSignAsyncSpy = jest.spyOn(jwtService, 'signAsync');

      // Act
      const result = await authService.signIn(mockCredentials);

      // Assert
      expect(result).toEqual({ access_token: 'access-token', user: mockUser });
      expect(jwtSignAsyncSpy).toHaveBeenCalledWith({ sub: mockUser.id });
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      // Arrange
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

      // Act & Assert
      await expect(authService.signIn(mockCredentials)).rejects.toBeInstanceOf(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      // Arrange
      userService.findOneByEmail = jest.fn(() => Promise.resolve(undefined));

      // Act & Assert
      await expect(authService.signIn(mockCredentials)).rejects.toBeInstanceOf(
        UnauthorizedException
      );
    });
  });

  describe('signInOIDC', () => {
    it('should return access token if successful', async () => {
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
      const result = await authService.signInOIDC('ID token');

      // Assert
      expect(result).toEqual({ access_token: 'access-token', user: mockUser });
    });

    it('should create user if it does not exist', async () => {
      // Arrange
      jest
        .spyOn(jwt, 'verify')
        .mockImplementation((_token, _getKey, _options, callback) => {
          const mockPayload = { name: 'User Name', email: 'user@email.com' };
          if (callback) {
            callback(null, mockPayload);
          }
        });

      userService.findOneByEmail = () => undefined;

      // Act
      await authService.signInOIDC('ID token');

      // Assert
      expect(userService.create).toHaveBeenCalledWith(
        'User Name',
        'user@email.com'
      );
    });

    it('should return exception if token is invalid', async () => {
      // Arrange
      jest
        .spyOn(jwt, 'verify')
        .mockImplementation((_token, _getKey, _options, callback) => {
          if (callback) {
            callback(new Error('invalid') as jwt.VerifyErrors, null);
          }
        });

      // Act
      const result = authService.signInOIDC('ID token');

      // Assert
      await expect(result).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('updatePassword', () => {
    const mockUserId = 'user-id';
    const mockUpdatePasswordInput = {
      oldPassword: 'old-pass',
      newPassword: 'new-pass'
    };
    const mockUpdatedUser = {
      ...mockUser,
      password: 'new-pass-hash'
    } as User;

    it('should update user password if old password is correct', async () => {
      // Arrange
      jest
        .spyOn(userService, 'updatePassword')
        .mockResolvedValue(mockUpdatedUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(async () => 'new-pass-hash');

      // Act
      const result = await authService.updatePassword(
        mockUserId,
        mockUpdatePasswordInput
      );

      // Assert
      expect(result).toEqual(mockUpdatedUser);
      expect(userService.updatePassword).toHaveBeenCalledWith(
        mockUserId,
        'new-pass-hash'
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        mockUpdatePasswordInput.oldPassword,
        mockUser.password
      );
    });

    it('should throw BadRequestException if old password is incorrect', async () => {
      // Arrange
      jest.spyOn(userService, 'findOneById').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

      // Act & Assert
      await expect(
        authService.updatePassword(mockUserId, mockUpdatePasswordInput)
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      // Arrange
      jest.spyOn(userService, 'findOneById').mockResolvedValue(undefined);

      // Act & Assert
      await expect(
        authService.updatePassword(mockUserId, mockUpdatePasswordInput)
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('requestRecovery', () => {
    it('should send recovery email', async () => {
      // Act
      await authService.requestRecovery('user@email.com');

      // Assert
      expect(mailerService.sendMail).toHaveBeenCalled();
    });
  });

  describe('passwordRecovery', () => {
    it('should update password', async () => {
      // Act
      await authService.passwordRecovery('token', 'new-pass');

      // Assert
      expect(userService.updatePassword).toHaveBeenCalled();
    });

    it('should throw if token is invalid', async () => {
      // Arrange
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('invalid');
      });

      // Act
      const response = authService.passwordRecovery('token', 'new-pass');

      // Assert
      await expect(response).rejects.toBeInstanceOf(BadRequestException);
      expect(userService.updatePassword).not.toHaveBeenCalled();
    });

    it('should throw if user is not found', async () => {
      // Arrange
      jest.spyOn(userService, 'findOneById').mockResolvedValue(undefined);

      // Act
      const response = authService.passwordRecovery('token', 'new-pass');

      // Assert
      await expect(response).rejects.toBeInstanceOf(BadRequestException);
      expect(userService.updatePassword).not.toHaveBeenCalled();
    });
  });
});
