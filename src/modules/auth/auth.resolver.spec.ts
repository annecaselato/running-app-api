import { Test, TestingModule } from '@nestjs/testing';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { SignInInputDto } from './dto/sign-in-input.dto';
import { SignInResponseDto } from './dto/sign-in-response.dto';

describe('AuthResolver', () => {
  let authResolver: AuthResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        {
          provide: AuthService,
          useFactory: () => ({
            signIn: jest.fn(() => ({ access_token: 'access-token' }))
          })
        }
      ]
    }).compile();

    authResolver = module.get<AuthResolver>(AuthResolver);
  });

  describe('signIn', () => {
    it('should return a SignInResponseDto', async () => {
      // Arrange
      const signInInput: SignInInputDto = {
        email: 'user@email.com',
        password: 'pass'
      };

      // Act
      const result: SignInResponseDto = await authResolver.signIn(signInInput);

      // Assert
      expect(result).toEqual({ access_token: 'access-token' });
    });
  });
});
