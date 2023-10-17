import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './activity.entity';
import { User } from '../users/user.entity';
import { ActivityService } from './activity.service';
import { ActivityType } from './activity-type.entity';

describe('ActivityService', () => {
  let activityService: ActivityService;
  let activityRepository: Repository<Activity>;

  const REPOSITORY_TOKEN = getRepositoryToken(Activity);

  const mockUser = {
    id: 'user-id'
  } as User;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityService,
        {
          provide: REPOSITORY_TOKEN,
          useValue: {
            create: jest.fn().mockResolvedValue({}),
            save: jest.fn().mockResolvedValue({}),
            delete: jest.fn().mockResolvedValue({}),
            createQueryBuilder: jest.fn().mockReturnValue({
              innerJoin: jest.fn().mockReturnThis(),
              innerJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getOne: jest.fn().mockResolvedValue({}),
              getMany: jest.fn().mockResolvedValue([])
            })
          }
        }
      ]
    }).compile();

    activityService = module.get<ActivityService>(ActivityService);
    activityRepository = module.get<Repository<Activity>>(REPOSITORY_TOKEN);
  });

  it('activity service should be defined', () => {
    expect(activityService).toBeDefined();
  });

  it('activity repository should be defined', () => {
    expect(activityRepository).toBeDefined();
  });

  describe('create', () => {
    it('should call activityRepository.create with correct parameters', async () => {
      // Arrange
      const type = {
        id: 'type-id',
        type: 'Run'
      } as ActivityType;

      const newActivity = {
        datetime: '2012-12-12T20:22:20',
        status: 'Planned',
        typeId: 'type-id'
      };

      // Act
      await activityService.create(newActivity, mockUser, type);

      // Assert
      expect(activityRepository.create).toHaveBeenCalledWith({
        ...newActivity,
        user: mockUser,
        type
      });
    });
  });

  describe('update', () => {
    it('should call activityRepository.save with correct parameters', async () => {
      // Arrange
      const updatedActivity = {
        id: 'activity-id',
        datetime: '2012-12-12T20:22:20',
        status: 'Completed',
        typeId: 'type-id'
      } as unknown as Activity;

      // Act
      await activityService.update(updatedActivity);

      // Assert
      expect(activityRepository.save).toHaveBeenCalledWith(updatedActivity);
    });
  });

  describe('delete', () => {
    it('should call activityRepository.delete with correct ID', async () => {
      // Arrange
      const activityIdToDelete = 'activity-id';

      // Act
      await activityService.delete(activityIdToDelete);

      // Assert
      expect(activityRepository.delete).toHaveBeenCalledWith(
        activityIdToDelete
      );
    });
  });

  describe('findById', () => {
    it('should call activityRepository.createQueryBuilder with correct ID and userId', async () => {
      // Act
      await activityService.findById('activity-id', mockUser.id);

      // Assert
      const query = activityRepository.createQueryBuilder();

      expect(query.innerJoin).toHaveBeenCalledWith('activity.user', 'user');
      expect(query.where).toHaveBeenCalledWith({ id: 'activity-id' });
      expect(query.andWhere).toHaveBeenCalledWith('user.id= :userId', {
        userId: 'user-id'
      });
      expect(query.getOne).toHaveBeenCalled();
    });
  });

  describe('findByType', () => {
    it('should call activityRepository.createQueryBuilder with correct typeId and userId', async () => {
      // Act
      await activityService.findByType('type-id', mockUser.id);

      // Assert
      const query = activityRepository.createQueryBuilder();

      expect(query.innerJoin).toHaveBeenCalledWith('activity.user', 'user');
      expect(query.innerJoin).toHaveBeenCalledWith('activity.type', 'type');
      expect(query.where).toHaveBeenCalledWith('type.id= :typeId', {
        typeId: 'type-id'
      });
      expect(query.andWhere).toHaveBeenCalledWith('user.id= :userId', {
        userId: 'user-id'
      });
      expect(query.getOne).toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('should call activityRepository.createQueryBuilder with correct userId', async () => {
      // Act
      await activityService.list(mockUser.id);

      // Assert
      const query = activityRepository.createQueryBuilder();

      expect(query.innerJoin).toHaveBeenCalledWith('activity.user', 'user');
      expect(query.innerJoinAndSelect).toHaveBeenCalledWith(
        'activity.type',
        'type'
      );
      expect(query.where).toHaveBeenCalledWith('user.id = :userId', {
        userId: 'user-id'
      });
      expect(query.getMany).toHaveBeenCalled();
    });
  });
});
