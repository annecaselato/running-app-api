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
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
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
    it('should call userRespository.insert with correct parameters', async () => {
      const newUser = {
        name: 'Test User',
        email: 'testuser@email.com',
        password: 'pass123',
      };
      await userService.create(newUser);
      expect(userRepository.create).toHaveBeenCalledWith(newUser);
    });
  });

  describe('findOneByEmail', () => {
    it('should call userRespository.findOne with correct parameters', async () => {
      await userService.findOneByEmail('test@email.com');
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@email.com' },
      });
    });
  });
});
