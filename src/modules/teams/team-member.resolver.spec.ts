import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Team } from './team.entity';
import { User } from '../users/user.entity';
import { TeamService } from './team.service';
import { TeamMemberService } from './team-member.service';
import { CreateMembersInput } from './dto';
import { TeamMemberResolver } from './team-member.resolver';
import { TeamMember } from './team-member.entity';
import { IDInput } from 'shared/dto/id.input';

describe('TeamMemberResolver', () => {
  let resolver: TeamMemberResolver;
  let service: TeamMemberService;
  let teamService: TeamService;

  const mockUser = {
    id: 'user-id',
    email: 'member@team.com'
  } as User;

  const mockTeam = {
    id: 'team-id',
    members: [],
    coach: {
      id: 'coach-id'
    }
  } as Team;

  const mockTeamMember = {
    id: 'member-id',
    email: 'member@team.com',
    team: mockTeam,
    user: mockUser
  } as TeamMember;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamMemberResolver,
        {
          provide: TeamService,
          useFactory: () => ({ findById: jest.fn(() => mockTeam) })
        },
        {
          provide: TeamMemberService,
          useFactory: () => ({
            create: jest.fn((input) => ({
              id: 'new-member-id',
              ...input
            })),
            update: jest.fn((input) => input),
            delete: jest.fn(),
            findById: jest.fn(() => mockTeamMember),
            listInvitations: jest.fn(() => [mockTeamMember]),
            listAthleteTeams: jest.fn(() => [mockTeamMember])
          })
        }
      ]
    }).compile();

    resolver = module.get(TeamMemberResolver);
    service = module.get(TeamMemberService);
    teamService = module.get(TeamService);
  });

  describe('createMembers', () => {
    const input: CreateMembersInput = {
      id: 'team-id',
      members: ['member@example.com']
    };

    it('should return members team', async () => {
      // Act
      const result = await resolver.createMembers(input, mockUser);

      // Assert
      expect(result).toEqual({
        id: 'team-id',
        members: [],
        coach: {
          id: 'coach-id'
        }
      });
    });

    it('should return an exception if team is not found', async () => {
      // Arrange
      jest
        .spyOn(teamService, 'findById')
        .mockImplementation(() => Promise.resolve(undefined));

      // Act
      const result = await resolver.createMembers(input, mockUser);

      // Assert
      expect(result).toBeInstanceOf(BadRequestException);
    });
  });

  describe('acceptInvitation', () => {
    const input: IDInput = {
      id: 'member-id'
    };

    it('should return the updated member', async () => {
      // Act
      const result = await resolver.acceptInvitation(input, mockUser);

      // Assert
      expect(result).toEqual(mockTeamMember);
    });

    it('should return an exception if membership is not found', async () => {
      // Arrange
      jest
        .spyOn(service, 'findById')
        .mockImplementation(() => Promise.resolve(undefined));

      // Act
      const result = await resolver.acceptInvitation(input, mockUser);

      // Assert
      expect(result).toBeInstanceOf(BadRequestException);
    });
  });

  describe('deleteMember', () => {
    it('should return the ID of the deleted member', async () => {
      // Act
      const result = await resolver.deleteMember({ id: 'member-id' }, mockUser);

      // Assert
      expect(result).toEqual('member-id');
    });

    it('should return the ID even if the member does not exist', async () => {
      // Arrange
      jest
        .spyOn(service, 'findById')
        .mockImplementation(() => Promise.resolve(undefined));

      // Act
      const result = await resolver.deleteMember(
        { id: 'non-existent-id' },
        mockUser
      );

      // Assert
      expect(result).toEqual('non-existent-id');
    });
  });

  describe('listAthleteTeams', () => {
    it('should return lists of invitations and memberships', async () => {
      // Act
      const result = await resolver.listAthleteTeams(mockUser);

      // Assert
      expect(result).toEqual({
        invitations: [mockTeamMember],
        teams: [mockTeamMember]
      });
    });
  });
});
