import { Test, TestingModule } from '@nestjs/testing';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { User } from './user.entity';

describe('UserResolver', () => {
  let resolver: UserResolver;
  let userService: UserService;

  const newUser = {
    name: 'Test User',
    email: 'user@test.com',
    password: 'Pass123'
  };

  const authUser = { id: 'user-id', ...newUser } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserResolver,
        {
          provide: UserService,
          useFactory: () => ({
            create: jest.fn((newUser) => ({ id: '1', ...newUser })),
            update: jest.fn(() => authUser),
            delete: jest.fn(() => ({})),
            findOneById: jest.fn(() => authUser)
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

  describe('updateUser', () => {
    it('should update the authenticated user', async () => {
      // Arrange
      const updateUserInput = { name: 'Updated User' };

      const updateSpy = jest
        .spyOn(userService, 'update')
        .mockResolvedValue({ ...authUser, ...updateUserInput } as User);

      // Act
      const result = await resolver.updateUser(updateUserInput, authUser);

      // Assert
      expect(result).toEqual({ ...authUser, ...updateUserInput });
      expect(updateSpy).toHaveBeenCalledWith(authUser.id, updateUserInput);
    });
  });

  describe('deleteUser', () => {
    it('should delete the authenticated user', async () => {
      // Arrange
      const deleteSpy = jest
        .spyOn(userService, 'delete')
        .mockResolvedValue({} as any);

      // Act
      const result = await resolver.deleteUser(authUser);

      // Assert
      expect(result).toEqual(authUser.id);
      expect(deleteSpy).toHaveBeenCalledWith(authUser.id);
    });
  });

  describe('me', () => {
    it('should return the authenticated user', () => {
      // Act
      const result = resolver.me(authUser);

      // Assert
      expect(result).toEqual(authUser);
    });
  });
});
