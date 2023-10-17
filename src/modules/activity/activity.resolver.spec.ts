import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Activity } from './activity.entity';
import { ActivityType } from './activity-type.entity';
import { User } from '../users/user.entity';
import { ActivityResolver } from './activity.resolver';
import { TypeService } from './type.service';
import { ActivityService } from './activity.service';
import { CreateActivityInput, UpdateActivityInput } from './dto';

describe('ActivityResolver', () => {
  let activityResolver: ActivityResolver;
  let activityService: ActivityService;
  let typeService: TypeService;

  const mockUser = {
    id: 'user-id'
  } as User;

  const mockType = {
    id: 'type-id',
    type: 'Run',
    description: 'Easy pace run.'
  } as ActivityType;

  const mockActivity = {
    datetime: new Date(),
    status: 'Planned',
    type: mockType,
    goalDistance: 5.0,
    distance: 2.5,
    goalDuration: '00:30:00',
    duration: '00:20:00'
  } as Activity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityResolver,
        {
          provide: TypeService,
          useFactory: () => ({ findById: jest.fn(() => mockType) })
        },
        {
          provide: ActivityService,
          useFactory: () => ({
            create: jest.fn((input) => ({ id: 'new-activity-id', ...input })),
            update: jest.fn((input) => input),
            delete: jest.fn(),
            findById: jest.fn(() => mockActivity),
            findByType: jest.fn(() => undefined),
            list: jest.fn(() => [mockActivity])
          })
        }
      ]
    }).compile();

    activityResolver = module.get<ActivityResolver>(ActivityResolver);
    activityService = module.get<ActivityService>(ActivityService);
    typeService = module.get<TypeService>(TypeService);
  });

  describe('createActivity', () => {
    const input: CreateActivityInput = {
      datetime: new Date().toISOString(),
      status: 'Planned',
      typeId: 'type-id',
      goalDistance: 5.0,
      distance: 2.5,
      goalDuration: '00:30:00',
      duration: '00:20:00'
    };

    it('should return new activity', async () => {
      // Act
      const result = await activityResolver.createActivity(input, mockUser);

      // Assert
      expect(result).toEqual({ id: 'new-activity-id', ...input });
    });

    it('should return an exception if type do not exist', async () => {
      // Arrange
      jest
        .spyOn(typeService, 'findById')
        .mockImplementation(() => Promise.resolve(undefined));

      // Act
      const result = await activityResolver.createActivity(input, mockUser);

      // Assert
      expect(result).toBeInstanceOf(BadRequestException);
    });
  });

  describe('updateActivity', () => {
    const input: UpdateActivityInput = {
      id: 'activity-id',
      datetime: new Date().toISOString(),
      status: 'Completed',
      typeId: 'type-id'
    };

    it('should return the updated activity', async () => {
      // Act
      const result = await activityResolver.updateActivity(input, mockUser);

      // Assert
      expect(result).toEqual({ ...mockActivity, ...input });
    });

    it('should return an exception if activity is not found', async () => {
      // Arrange
      jest
        .spyOn(activityService, 'findById')
        .mockImplementation(() => Promise.resolve(undefined));

      // Act
      const result = await activityResolver.updateActivity(input, mockUser);

      // Assert
      expect(result).toBeInstanceOf(BadRequestException);
    });

    it('should return an exception if type is not found', async () => {
      // Arrange
      jest
        .spyOn(typeService, 'findById')
        .mockImplementation(() => Promise.resolve(undefined));

      // Act
      const result = await activityResolver.updateActivity(input, mockUser);

      // Assert
      expect(result).toBeInstanceOf(BadRequestException);
    });
  });

  describe('deleteActivity', () => {
    it('should return the ID of the deleted activity', async () => {
      // Act
      const result = await activityResolver.deleteActivity(
        { id: 'activity-id' },
        mockUser
      );

      // Assert
      expect(result).toEqual('activity-id');
    });

    it('should return the ID even if the activity does not exist', async () => {
      // Arrange
      jest
        .spyOn(activityService, 'findById')
        .mockImplementation(() => Promise.resolve(undefined));

      // Act
      const result = await activityResolver.deleteActivity(
        { id: 'non-existent-id' },
        mockUser
      );

      // Assert
      expect(result).toEqual('non-existent-id');
    });
  });

  describe('getActivity', () => {
    it('should return the specified activity', async () => {
      // Act
      const result = await activityResolver.getActivity(
        { id: 'activity-id' },
        mockUser
      );

      // Assert
      expect(result).toEqual(mockActivity);
    });

    it('should return an exception if activity is not found', async () => {
      // Arrange
      jest
        .spyOn(activityService, 'findById')
        .mockImplementation(() => Promise.resolve(undefined));

      // Act
      const result = await activityResolver.getActivity(
        { id: 'non-existent-id' },
        mockUser
      );

      // Assert
      expect(result).toBeInstanceOf(BadRequestException);
    });
  });

  describe('listActivities', () => {
    it('should return a list of activities', async () => {
      // Act
      const result = await activityResolver.listActivities(mockUser);

      // Assert
      expect(result).toEqual([mockActivity]);
    });
  });
});
