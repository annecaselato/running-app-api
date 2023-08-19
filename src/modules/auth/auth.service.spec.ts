import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserService } from '../users/user.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-id',
    email: 'user@email.com',
    name: 'User',
    pass: 'pass-hash'
  };

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
            findOneByEmail: jest.fn(() => Promise.resolve(mockUser))
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
      expect(result).toEqual({ access_token: 'access-token' });
      expect(jwtSignAsyncSpy).toHaveBeenCalledWith({
        sub: mockUser.id,
        name: mockUser.name,
        email: mockUser.email
      });
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
});
