import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeService } from './type.service';
import { ActivityType } from './activity-type.entity';
import { User } from 'modules/users/user.entity';

describe('TypeService', () => {
  let typeService: TypeService;
  let typeRepository: Repository<ActivityType>;

  const REPOSITORY_TOKEN = getRepositoryToken(ActivityType);

  const mockUser = {
    id: 'user-id'
  } as User;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeService,
        {
          provide: REPOSITORY_TOKEN,
          useValue: {
            create: jest.fn().mockResolvedValue({}),
            save: jest.fn().mockResolvedValue({}),
            delete: jest.fn().mockResolvedValue({}),
            createQueryBuilder: jest.fn().mockReturnValue({
              innerJoin: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getOne: jest.fn().mockResolvedValue({}),
              getMany: jest.fn().mockResolvedValue([])
            })
          }
        }
      ]
    }).compile();

    typeService = module.get<TypeService>(TypeService);
    typeRepository = module.get<Repository<ActivityType>>(REPOSITORY_TOKEN);
  });

  it('type service should be defined', () => {
    expect(typeService).toBeDefined();
  });

  it('type repository should be defined', () => {
    expect(typeRepository).toBeDefined();
  });

  describe('create', () => {
    it('should call typeRepository.create with correct parameters', async () => {
      // Arrange
      const newType = {
        type: 'New Type',
        description: 'Type description.'
      };

      // Act
      await typeService.create(newType, mockUser);

      // Assert
      expect(typeRepository.create).toHaveBeenCalledWith({
        ...newType,
        user: mockUser
      });
    });
  });

  describe('update', () => {
    it('should call typeRepository.save with correct parameters', async () => {
      // Arrange
      const updatedType = {
        id: 'type-id',
        type: 'Updated Type',
        description: 'Updated description.'
      } as ActivityType;

      // Act
      await typeService.update(updatedType);

      // Assert
      expect(typeRepository.save).toHaveBeenCalledWith(updatedType);
    });
  });

  describe('delete', () => {
    it('should call typeRepository.delete with correct ID', async () => {
      // Arrange
      const typeIdToDelete = 'type-id';

      // Act
      await typeService.delete(typeIdToDelete);

      // Assert
      expect(typeRepository.delete).toHaveBeenCalledWith(typeIdToDelete);
    });
  });

  describe('findById', () => {
    it('should call typeRepository.createQueryBuilder with correct ID and userId', async () => {
      // Act
      await typeService.findById('type-id', mockUser.id);

      // Assert
      const query = typeRepository.createQueryBuilder();

      expect(query.innerJoin).toHaveBeenCalledWith('type.user', 'user');
      expect(query.where).toHaveBeenCalledWith({ id: 'type-id' });
      expect(query.andWhere).toHaveBeenCalledWith('user.id= :userId', {
        userId: 'user-id'
      });
      expect(query.getOne).toHaveBeenCalled();
    });
  });

  describe('findByType', () => {
    it('should call typeRepository.createQueryBuilder with correct type and userId', async () => {
      // Act
      await typeService.findByType('Run', mockUser.id);

      // Assert
      const query = typeRepository.createQueryBuilder();

      expect(query.innerJoin).toHaveBeenCalledWith('type.user', 'user');
      expect(query.where).toHaveBeenCalledWith({ type: 'Run' });
      expect(query.andWhere).toHaveBeenCalledWith('user.id= :userId', {
        userId: 'user-id'
      });
      expect(query.getOne).toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('should call typeRepository.createQueryBuilder with correct userId', async () => {
      // Act
      await typeService.list(mockUser.id);

      // Assert
      const query = typeRepository.createQueryBuilder();

      expect(query.innerJoin).toHaveBeenCalledWith('type.user', 'user');
      expect(query.where).toHaveBeenCalledWith('user.id = :userId', {
        userId: 'user-id'
      });
      expect(query.getMany).toHaveBeenCalled();
    });
  });
});
