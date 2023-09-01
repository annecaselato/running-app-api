import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserService } from '../users/user.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { User } from '../users/user.entity';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

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
            findOneByEmail: jest.fn(() => Promise.resolve(mockUser)),
            findOneById: jest.fn(() => Promise.resolve(mockUser)),
            updatePassword: jest.fn(() => Promise.resolve(mockUser))
          }
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(() => 'access-token')
          }
        }
      ]
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
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
});
