import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { GqlExecutionContext } from '@nestjs/graphql';
import { createMock } from '@golevelup/ts-jest';
import { AuthGuard } from './auth.guard';

describe('TokenAuthGuard', () => {
  let authGuard: AuthGuard;
  let reflector: Reflector;
  let jwtService: JwtService;

  const context = createMock<ExecutionContext>();

  const createGqlContext = (headers?: { [key: string]: string }) => () =>
    ({
      getContext: jest
        .fn()
        .mockReturnValue({ req: { headers: { ...headers } } })
    } as unknown as GqlExecutionContext);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthGuard, JwtService]
    }).compile();

    // Arrange
    authGuard = module.get<AuthGuard>(AuthGuard);
    reflector = module.get<Reflector>(Reflector);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    // Assert
    expect(authGuard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when the route is public', () => {
      // Arrange
      reflector.getAllAndOverride = jest.fn().mockReturnValue(true);

      // Act & Assert
      expect(authGuard.canActivate(context)).toBe(true);
    });

    it('should throw an UnauthorizedException if no token is provided', () => {
      // Arrange
      reflector.getAllAndOverride = jest.fn().mockReturnValue(false);
      GqlExecutionContext.create = createGqlContext();

      // Act & Assert
      expect(() => authGuard.canActivate(context)).toThrow(
        UnauthorizedException
      );
    });

    it('should throw an UnauthorizedException if the token is invalid', () => {
      // Arrange
      const token = 'Bearer invalid-token';
      reflector.getAllAndOverride = jest.fn().mockReturnValue(false);
      GqlExecutionContext.create = createGqlContext({ authorization: token });
      jwtService.verify = jest.fn(() => {
        throw new Error();
      });

      // Act & Assert
      expect(() => authGuard.canActivate(context)).toThrow(
        UnauthorizedException
      );
    });

    it('should return true if authorized', () => {
      // Arrange
      const token = 'Bearer valid-token';
      reflector.getAllAndOverride = jest.fn().mockReturnValue(false);
      GqlExecutionContext.create = createGqlContext({ authorization: token });
      jwtService.verify = jest.fn().mockReturnValue({
        sub: 'user-id',
        name: 'User',
        email: 'user-email'
      });

      // Act & Assert
      expect(authGuard.canActivate(context)).toBe(true);
    });
  });
});
