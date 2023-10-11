import { Test, TestingModule } from '@nestjs/testing';
import { ActivityType } from './activity-type.entity';
import { TypeResolver } from './type.resolver';
import { TypeService } from './type.service';
import { CreateTypeInput, GetTypeInput, UpdateTypeInput } from './dto';
import { User } from 'modules/users/user.entity';
import { BadRequestException } from '@nestjs/common';

describe('TypeResolver', () => {
  let typeResolver: TypeResolver;
  let typeService: TypeService;

  const mockUser = {
    id: 'user-id'
  } as User;

  const mockType = {
    id: 'type-id',
    type: 'Run',
    description: 'Easy pace run.'
  } as ActivityType;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeResolver,
        {
          provide: TypeService,
          useFactory: () => ({
            create: jest.fn((input) => ({ id: 'new-type-id', ...input })),
            update: jest.fn((input) => input),
            delete: jest.fn(),
            findById: jest.fn(() => mockType),
            findByType: jest.fn(() => undefined),
            list: jest.fn(() => [mockType])
          })
        }
      ]
    }).compile();

    typeResolver = module.get<TypeResolver>(TypeResolver);
    typeService = module.get<TypeService>(TypeService);
  });

  describe('createType', () => {
    it('should return new activity type', async () => {
      // Arrange
      const input: CreateTypeInput = {
        type: 'New Type',
        description: 'This is an activity type.'
      };

      // Act
      const result = await typeResolver.createType(input, mockUser);

      // Assert
      expect(result).toEqual({ id: 'new-type-id', ...input });
    });

    it('should return an exception if type already exists', async () => {
      // Arrange
      const input: CreateTypeInput = {
        type: 'Run'
      };

      jest
        .spyOn(typeService, 'findByType')
        .mockImplementation(() => Promise.resolve(mockType));

      // Act
      const result = await typeResolver.createType(input, mockUser);

      // Assert
      expect(result).toBeInstanceOf(BadRequestException);
    });
  });

  describe('updateType', () => {
    it('should return updated activity type', async () => {
      // Arrange
      const input: UpdateTypeInput = {
        id: 'type-id',
        type: 'Updated Type',
        description: 'Updated description.'
      };

      // Act
      const result = await typeResolver.updateType(input, mockUser);

      // Assert
      expect(result).toEqual(input);
    });

    it('should return an exception if type not found', async () => {
      // Arrange
      const input: UpdateTypeInput = {
        id: 'non-existent-type-id',
        type: 'Updated Type',
        description: 'Updated description.'
      };

      jest
        .spyOn(typeService, 'findById')
        .mockImplementation(() => Promise.resolve(undefined));

      // Act
      const result = await typeResolver.updateType(input, mockUser);

      // Assert
      expect(result).toBeInstanceOf(BadRequestException);
    });
  });

  describe('deleteType', () => {
    it('should return the deleted type ID', async () => {
      // Arrange
      const input: GetTypeInput = {
        id: 'type-id'
      };

      // Act
      const result = await typeResolver.deleteType(input, mockUser);

      // Assert
      expect(result).toEqual(input.id);
    });

    it('should return the ID if type not found', async () => {
      // Arrange
      const input: GetTypeInput = {
        id: 'non-existent-type-id'
      };

      jest
        .spyOn(typeService, 'findById')
        .mockImplementation(() => Promise.resolve(undefined));

      // Act
      const result = await typeResolver.deleteType(input, mockUser);

      // Assert
      expect(result).toEqual('non-existent-type-id');
    });
  });

  describe('getType', () => {
    it('should return an activity type by ID', async () => {
      // Arrange
      const input: GetTypeInput = {
        id: 'type-id'
      };

      // Act
      const result = await typeResolver.getType(input, mockUser);

      // Assert
      expect(result).toEqual(mockType);
    });

    it('should return an exception if type not found', async () => {
      // Arrange
      const input: GetTypeInput = {
        id: 'non-existent-type-id'
      };

      jest
        .spyOn(typeService, 'findById')
        .mockImplementation(() => Promise.resolve(undefined));

      // Act
      const result = await typeResolver.getType(input, mockUser);

      // Assert
      expect(result).toBeInstanceOf(BadRequestException);
    });
  });

  describe('listTypes', () => {
    it('should return a list of activity types', async () => {
      // Act
      const result = await typeResolver.listTypes(mockUser);

      // Assert
      expect(result).toEqual([mockType]);
    });
  });
});
