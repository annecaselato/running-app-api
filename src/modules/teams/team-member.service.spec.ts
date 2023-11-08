import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Team } from './team.entity';
import { TeamMember } from './team-member.entity';
import { TeamMemberService } from './team-member.service';

describe('TeamMemberService', () => {
  let service: TeamMemberService;
  let repository: Repository<TeamMember>;

  const REPOSITORY_TOKEN = getRepositoryToken(TeamMember);

  const mockUser = {
    id: 'user-id'
  } as User;

  const mockTeam = {
    id: 'team-id'
  } as Team;

  const mockTeamMember = {
    id: 'member-id'
  } as TeamMember;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamMemberService,
        {
          provide: REPOSITORY_TOKEN,
          useValue: {
            save: jest.fn().mockResolvedValue(mockTeamMember),
            update: jest.fn().mockResolvedValue(mockTeamMember),
            delete: jest.fn().mockResolvedValue({}),
            findOne: jest.fn().mockResolvedValue(mockTeamMember),
            find: jest.fn().mockResolvedValue([mockTeamMember]),
            createQueryBuilder: jest.fn().mockReturnValue({
              innerJoinAndSelect: jest.fn().mockReturnThis(),
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([])
            })
          }
        }
      ]
    }).compile();

    service = module.get(TeamMemberService);
    repository = module.get(REPOSITORY_TOKEN);
  });

  it('team member service should be defined', () => {
    expect(service).toBeDefined();
  });

  it('team member repository should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should call the repository with correct parameters', async () => {
      // Act
      await service.create('member@example.com', mockTeam);

      // Assert
      expect(repository.save).toHaveBeenCalledWith({
        email: 'member@example.com',
        team: mockTeam
      });
    });
  });

  describe('update', () => {
    it('should call the repository with correct parameters', async () => {
      // Act
      await service.update(mockTeamMember);

      // Assert
      expect(repository.save).toHaveBeenCalledWith(mockTeamMember);
    });
  });

  describe('delete', () => {
    it('should call the repository with correct parameters', async () => {
      // Act
      await service.delete('member-id');

      // Assert
      expect(repository.delete).toHaveBeenCalledWith('member-id');
    });
  });

  describe('findById', () => {
    it('should call repository with correct parameters', async () => {
      // Act
      await service.findById('member-id');

      // Assert
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'member-id' },
        relations: ['user', 'team', 'team.coach']
      });
    });
  });

  describe('listInvitations', () => {
    it('should call repository with correct parameters', async () => {
      // Act
      await service.listInvitations('user@email.com');

      // Assert
      expect(repository.find).toHaveBeenCalledWith({
        where: { email: 'user@email.com', acceptedAt: IsNull() },
        relations: ['team', 'team.coach']
      });
    });
  });

  describe('listAthleteTeams', () => {
    it('should call repository with correct parameters', async () => {
      // Act
      await service.listAthleteTeams(mockUser.id);

      // Assert
      const query = repository.createQueryBuilder();
      expect(query.where).toHaveBeenCalledWith('user.id= :userId', {
        userId: 'user-id'
      });
      expect(query.getMany).toHaveBeenCalled();
    });
  });
});
