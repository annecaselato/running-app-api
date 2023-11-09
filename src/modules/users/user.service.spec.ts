import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';

describe('UserService', () => {
  let userService: UserService;
  let userRepository: Repository<User>;

  const USER_REPOSITORY_TOKEN = getRepositoryToken(User);

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: USER_REPOSITORY_TOKEN,
          useValue: {
            create: jest.fn().mockResolvedValue({}),
            save: jest.fn().mockResolvedValue({}),
            delete: jest.fn().mockResolvedValue({}),
            findOne: jest.fn().mockResolvedValue({})
          }
        }
      ]
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(USER_REPOSITORY_TOKEN);
  });

  it('user service should be defined', () => {
    expect(userService).toBeDefined();
  });

  it('user repository should be defined', () => {
    expect(userRepository).toBeDefined();
  });

  describe('create', () => {
    it('should call userRepository.create with correct parameters', async () => {
      // Arrange
      const newUser = {
        name: 'Test User',
        email: 'testuser@email.com',
        password: 'pass123'
      };

      // Act
      await userService.create(newUser.name, newUser.email, newUser.password);

      // Assert
      expect(userRepository.create).toHaveBeenCalledWith(newUser);
    });
  });

  describe('findOneByEmail', () => {
    it('should call userRepository.findOne with correct parameters', async () => {
      // Act
      await userService.findOneByEmail('test@email.com');

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@email.com' }
      });
    });
  });

  describe('update', () => {
    it('should call userRepository.save with correct parameters', async () => {
      // Arrange
      const userId = 'user-id';
      const updateUserInput = { name: 'Updated User' };

      // Act
      await userService.update(userId, updateUserInput);

      // Assert
      expect(userRepository.save).toHaveBeenCalledWith({
        id: userId,
        ...updateUserInput
      });
    });
  });

  describe('updatePassword', () => {
    it('should call userRepository.save with correct parameters', async () => {
      // Arrange
      const userId = 'user-id';
      const newPassword = 'new-pass';

      // Act
      await userService.updatePassword(userId, newPassword);

      // Assert
      expect(userRepository.save).toHaveBeenCalledWith({
        id: userId,
        password: newPassword
      });
    });
  });

  describe('updateProfile', () => {
    it('should call userRepository.save with correct parameters', async () => {
      // Arrange
      const userId = 'user-id';
      const profile = 'Athlete';

      // Act
      await userService.updateProfile(userId, profile);

      // Assert
      expect(userRepository.save).toHaveBeenCalledWith({ id: userId, profile });
    });
  });

  describe('delete', () => {
    it('should call userRepository.delete with correct parameters', async () => {
      // Arrange
      const userId = 'user-id';

      // Act
      await userService.delete(userId);

      // Assert
      expect(userRepository.delete).toHaveBeenCalledWith(userId);
    });
  });

  describe('findOneById', () => {
    it('should call userRepository.findOne with correct parameters', async () => {
      // Arrange
      const userId = 'user-id';

      // Act
      await userService.findOneById(userId);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId }
      });
    });
  });
});
