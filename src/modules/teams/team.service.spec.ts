import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { TeamService } from './team.service';
import { Team } from './team.entity';

describe('TeamService', () => {
  let teamService: TeamService;
  let teamRepository: Repository<Team>;

  const REPOSITORY_TOKEN = getRepositoryToken(Team);

  const mockUser = {
    id: 'user-id'
  } as User;

  const mockTeam = {
    id: 'team-id'
  } as Team;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamService,
        {
          provide: REPOSITORY_TOKEN,
          useValue: {
            save: jest.fn().mockResolvedValue(mockTeam),
            delete: jest.fn().mockResolvedValue({}),
            createQueryBuilder: jest.fn().mockReturnValue({
              innerJoin: jest.fn().mockReturnThis(),
              innerJoinAndSelect: jest.fn().mockReturnThis(),
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              getOne: jest.fn().mockResolvedValue({}),
              getMany: jest.fn().mockResolvedValue([])
            })
          }
        }
      ]
    }).compile();

    teamService = module.get(TeamService);
    teamRepository = module.get(REPOSITORY_TOKEN);
  });

  it('team service should be defined', () => {
    expect(teamService).toBeDefined();
  });

  it('team repository should be defined', () => {
    expect(teamRepository).toBeDefined();
  });

  describe('create', () => {
    it('should call the teamRepository and memberService with correct parameters', async () => {
      // Arrange
      const newTeam = {
        name: 'New Team',
        members: ['member@example.com']
      };

      // Act
      await teamService.create(newTeam, mockUser);

      // Assert
      expect(teamRepository.save).toHaveBeenCalledWith({
        name: 'New Team',
        coach: mockUser
      });
    });
  });

  describe('update', () => {
    it('should call the teamRepository with correct parameters', async () => {
      // Act
      await teamService.update(mockTeam);

      // Assert
      expect(teamRepository.save).toHaveBeenCalledWith(mockTeam);
    });
  });

  describe('delete', () => {
    it('should call the teamRepository with correct parameters', async () => {
      // Act
      await teamService.delete('team-id');

      // Assert
      expect(teamRepository.delete).toHaveBeenCalledWith('team-id');
    });
  });

  describe('findById', () => {
    it('should call teamRepository with correct parameters', async () => {
      // Act
      await teamService.findById('team-id', mockUser.id);

      // Assert
      const query = teamRepository.createQueryBuilder();
      expect(query.where).toHaveBeenCalledWith({ id: 'team-id' });
      expect(query.andWhere).toHaveBeenCalledWith('coach.id= :coachId', {
        coachId: 'user-id'
      });
      expect(query.getOne).toHaveBeenCalled();
    });
  });

  describe('listCoachTeams', () => {
    it('should call teamRepository with correct parameters', async () => {
      // Act
      await teamService.listCoachTeams(mockUser.id);

      // Assert
      const query = teamRepository.createQueryBuilder();
      expect(query.where).toHaveBeenCalledWith('coach.id= :coachId', {
        coachId: 'user-id'
      });
      expect(query.getMany).toHaveBeenCalled();
    });
  });
});
