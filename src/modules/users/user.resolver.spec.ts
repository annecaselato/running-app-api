import { Test, TestingModule } from '@nestjs/testing';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';

describe('UserResolver', () => {
  let resolver: UserResolver;

  const newUser = {
    name: 'Test User',
    email: 'user@test.com',
    password: 'Pass123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserResolver,
        {
          provide: UserService,
          useFactory: () => ({
            create: jest.fn((newUser) => ({ id: '1', ...newUser })),
          }),
        },
      ],
    }).compile();

    resolver = module.get<UserResolver>(UserResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createUser', () => {
    it('Should return new user', () => {
      expect(resolver.createUser(newUser)).toEqual({ id: '1', ...newUser });
    });
  });
});
