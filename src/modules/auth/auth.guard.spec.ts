import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { GqlExecutionContext } from '@nestjs/graphql';
import { createMock } from '@golevelup/ts-jest';
import { AuthGuard } from './auth.guard';
import { UserService } from '../users/user.service';
import { IS_PUBLIC_KEY } from '../../shared/decorators';

describe('TokenAuthGuard', () => {
  let authGuard: AuthGuard;
  let reflector: Reflector;
  let jwtService: JwtService;
  let userService: UserService;

  const context = createMock<ExecutionContext>();

  const createGqlContext = (headers?: { [key: string]: string }) => () =>
    ({
      getContext: jest
        .fn()
        .mockReturnValue({ req: { headers: { ...headers } } })
    } as unknown as GqlExecutionContext);

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        JwtService,
        {
          provide: UserService,
          useValue: {
            findOneById: jest.fn()
          }
        }
      ]
    }).compile();

    // Arrange
    authGuard = module.get<AuthGuard>(AuthGuard);
    reflector = module.get<Reflector>(Reflector);
    jwtService = module.get<JwtService>(JwtService);
    userService = module.get<UserService>(UserService);
  });

  beforeEach(() => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(false);
    jwtService.verify = jest.fn().mockReturnValue({ sub: 'user-id' });
    userService.findOneById = jest
      .fn()
      .mockReturnValue({ id: 'user-id', profile: 'Athlete' });
    GqlExecutionContext.create = createGqlContext({
      authorization: 'Bearer valid-token'
    });
  });

  it('should be defined', () => {
    expect(authGuard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when the route is public', async () => {
      // Arrange
      reflector.getAllAndOverride = jest.fn().mockReturnValue(true);

      // Act & Assert
      expect(await authGuard.canActivate(context)).toBe(true);
    });

    it('should return true if authorized', async () => {
      // Act & Assert
      expect(await authGuard.canActivate(context)).toEqual(true);
    });

    it('should throw an UnauthorizedException if no token is provided', () => {
      // Arrange
      GqlExecutionContext.create = createGqlContext();

      // Act & Assert
      expect(() => authGuard.canActivate(context)).rejects.toBeInstanceOf(
        UnauthorizedException
      );
    });

    it('should throw an UnauthorizedException if the token is invalid', () => {
      // Arrange
      jwtService.verify = jest.fn().mockImplementation(() => {
        throw new Error();
      });

      // Act & Assert
      expect(() => authGuard.canActivate(context)).rejects.toBeInstanceOf(
        UnauthorizedException
      );
    });

    it('should throw an UnauthorizedException if the user is not found', () => {
      // Arrange
      userService.findOneById = jest.fn().mockReturnValue(undefined);

      // Act & Assert
      expect(() => authGuard.canActivate(context)).rejects.toBeInstanceOf(
        UnauthorizedException
      );
    });

    it('should return an UnauthorizedException if the user role is invalid', async () => {
      // Arrange
      reflector.getAllAndOverride = jest.fn().mockImplementation((key) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === 'roles') return ['Coach'];
      });

      // Act & Assert
      expect(() => authGuard.canActivate(context)).rejects.toBeInstanceOf(
        UnauthorizedException
      );
    });
  });
});
