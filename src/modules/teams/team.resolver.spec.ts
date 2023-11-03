import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Team } from './team.entity';
import { User } from '../users/user.entity';
import { TeamResolver } from './team.resolver';
import { TeamService } from './team.service';
import { TeamMemberService } from './team-member.service';
import { CreateTeamInput, UpdateTeamInput } from './dto';

describe('TeamResolver', () => {
  let teamResolver: TeamResolver;
  let teamService: TeamService;

  const mockUser = {
    id: 'user-id'
  } as User;

  const mockTeam = {
    name: 'Test Team',
    description: 'Team test description',
    coach: mockUser
  } as Team;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamResolver,
        {
          provide: TeamMemberService,
          useFactory: () => ({ create: jest.fn() })
        },
        {
          provide: TeamService,
          useFactory: () => ({
            create: jest.fn((input) => ({
              id: 'new-team-id',
              name: input.name,
              description: input.description
            })),
            update: jest.fn((input) => input),
            delete: jest.fn(),
            findById: jest.fn(() => mockTeam),
            listCoachTeams: jest.fn(() => [mockTeam])
          })
        }
      ]
    }).compile();

    teamResolver = module.get(TeamResolver);
    teamService = module.get(TeamService);
  });

  describe('createTeam', () => {
    const input: CreateTeamInput = {
      name: 'New Team',
      members: ['member@example.com']
    };

    it('should return new team', async () => {
      // Act
      const result = await teamResolver.createTeam(input, mockUser);

      // Assert
      expect(result).toEqual({ id: 'new-team-id', name: 'New Team' });
    });
  });

  describe('updateTeam', () => {
    const input: UpdateTeamInput = {
      id: 'team-id',
      name: 'Edit team'
    };

    it('should return the updated team', async () => {
      // Act
      const result = await teamResolver.updateTeam(input, mockUser);

      // Assert
      expect(result).toEqual({ ...mockTeam, ...input });
    });

    it('should return an exception if team is not found', async () => {
      // Arrange
      jest
        .spyOn(teamService, 'findById')
        .mockImplementation(() => Promise.resolve(undefined));

      // Act
      const result = await teamResolver.updateTeam(input, mockUser);

      // Assert
      expect(result).toBeInstanceOf(BadRequestException);
    });
  });

  describe('deleteTeam', () => {
    it('should return the ID of the deleted team', async () => {
      // Act
      const result = await teamResolver.deleteTeam({ id: 'team-id' }, mockUser);

      // Assert
      expect(result).toEqual('team-id');
    });

    it('should return the ID even if the team does not exist', async () => {
      // Arrange
      jest
        .spyOn(teamService, 'findById')
        .mockImplementation(() => Promise.resolve(undefined));

      // Act
      const result = await teamResolver.deleteTeam(
        { id: 'non-existent-id' },
        mockUser
      );

      // Assert
      expect(result).toEqual('non-existent-id');
    });
  });

  describe('getTeam', () => {
    it('should return the specified team', async () => {
      // Act
      const result = await teamResolver.getTeam({ id: 'team-id' }, mockUser);

      // Assert
      expect(result).toEqual(mockTeam);
    });

    it('should return an exception if team is not found', async () => {
      // Arrange
      jest
        .spyOn(teamService, 'findById')
        .mockImplementation(() => Promise.resolve(undefined));

      // Act
      const result = await teamResolver.getTeam(
        { id: 'non-existent-id' },
        mockUser
      );

      // Assert
      expect(result).toBeInstanceOf(BadRequestException);
    });
  });

  describe('listCoachTeams', () => {
    it('should return a list of teams', async () => {
      // Act
      const result = await teamResolver.listCoachTeams(mockUser);

      // Assert
      expect(result).toEqual([mockTeam]);
    });
  });
});
