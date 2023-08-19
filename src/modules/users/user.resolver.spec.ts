import { Test, TestingModule } from '@nestjs/testing';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';

describe('UserResolver', () => {
  let resolver: UserResolver;
  let userService: UserService;

  const newUser = {
    name: 'Test User',
    email: 'user@test.com',
    password: 'Pass123'
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserResolver,
        {
          provide: UserService,
          useFactory: () => ({
            create: jest.fn((newUser) => ({ id: '1', ...newUser }))
          })
        }
      ]
    }).compile();

    resolver = module.get<UserResolver>(UserResolver);
    userService = module.get<UserService>(UserService);
  });

  it('user resolver should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('user service should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      // Arrange
      const createSpy = jest.spyOn(userService, 'create');

      // Act
      const result = await resolver.createUser(newUser);

      // Assert
      expect(result).toEqual({ id: '1', ...newUser });
      expect(createSpy).toHaveBeenCalledWith(newUser);
    });
  });
});
