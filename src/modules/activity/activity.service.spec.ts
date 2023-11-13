import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './activity.entity';
import { User } from '../users/user.entity';
import { ActivityService } from './activity.service';
import { DateUtil } from '../../utils/date.util';

describe('ActivityService', () => {
  let activityService: ActivityService;
  let activityRepository: Repository<Activity>;

  const REPOSITORY_TOKEN = getRepositoryToken(Activity);

  const mockUser = {
    id: 'user-id'
  } as User;

  const mockActivities = [
    {
      id: 'activity-1',
      datetime: new Date('2023-11-06T12:00:00'),
      status: 'Planned',
      type: 'Run'
    },
    {
      id: 'activity-2',
      datetime: new Date('2023-11-07T14:30:00'),
      status: 'Completed',
      type: 'Intervals'
    },
    {
      id: 'activity-3',
      datetime: new Date('2023-11-08T08:45:00'),
      status: 'Planned',
      type: 'Walk'
    }
  ];

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
            findOne: jest.fn().mockResolvedValue({}),
            find: jest.fn().mockResolvedValue(mockActivities)
          }
        }
      ]
    }).compile();

    activityService = module.get(ActivityService);
    activityRepository = module.get(REPOSITORY_TOKEN);
  });

  it('activity service should be defined', () => {
    expect(activityService).toBeDefined();
  });

  it('activity repository should be defined', () => {
    expect(activityRepository).toBeDefined();
  });

  describe('create', () => {
    it('should call activityRepository.create with correct parameters', async () => {
      const newActivity = {
        datetime: '2012-12-12T20:22:20',
        status: 'Planned',
        type: 'Run'
      };

      // Act
      await activityService.create(newActivity, mockUser);

      // Assert
      expect(activityRepository.create).toHaveBeenCalledWith({
        ...newActivity,
        user: mockUser
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
        type: 'Run'
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
    it('should call activityRepository.findOne with correct ID and userId', async () => {
      // Act
      await activityService.findById('activity-id', mockUser.id);

      // Assert
      expect(activityRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'activity-id', user: { id: mockUser.id } }
      });
    });
  });

  describe('list', () => {
    it('should call activityRepository.find with correct userId', async () => {
      // Act
      await activityService.list(mockUser.id);

      // Assert
      expect(activityRepository.find).toHaveBeenCalledWith({
        where: { user: { id: mockUser.id } }
      });
    });
  });

  describe('listWeek', () => {
    it('should return grouped list of activities', async () => {
      // Arrange
      jest
        .spyOn(DateUtil, 'getDays')
        .mockReturnValue([
          new Date('2023-11-06T00:00:00'),
          new Date('2023-11-07T00:00:00'),
          new Date('2023-11-08T00:00:00'),
          new Date('2023-11-09T00:00:00'),
          new Date('2023-11-10T00:00:00'),
          new Date('2023-11-11T00:00:00'),
          new Date('2023-11-12T00:00:00')
        ]);

      // Act
      const result = await activityService.listWeek(mockUser.id);

      // Assert
      expect(result).toEqual([
        {
          day: '11/6/2023',
          activities: [
            {
              id: 'activity-1',
              datetime: new Date('2023-11-06T12:00:00'),
              status: 'Planned',
              type: 'Run'
            }
          ]
        },
        {
          day: '11/7/2023',
          activities: [
            {
              id: 'activity-2',
              datetime: new Date('2023-11-07T14:30:00'),
              status: 'Completed',
              type: 'Intervals'
            }
          ]
        },
        {
          day: '11/8/2023',
          activities: [
            {
              id: 'activity-3',
              datetime: new Date('2023-11-08T08:45:00'),
              status: 'Planned',
              type: 'Walk'
            }
          ]
        },
        {
          day: '11/9/2023',
          activities: []
        },
        {
          day: '11/10/2023',
          activities: []
        },
        {
          day: '11/11/2023',
          activities: []
        },
        {
          day: '11/12/2023',
          activities: []
        }
      ]);
    });
  });
});
