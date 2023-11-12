import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { Team } from './team.entity';
import { User } from '../users/user.entity';
import { CreateTeamInput } from './dto';

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(Team)
    private readonly repository: Repository<Team>
  ) {}

  async create(input: CreateTeamInput, coach: User): Promise<Team> {
    const { name, description } = input;

    return await this.repository.save({ name, description, coach });
  }

  async update(team: Team): Promise<Team> {
    return this.repository.save(team);
  }

  async delete(id: string): Promise<DeleteResult> {
    return this.repository.delete(id);
  }

  async findById(id: string, coachId: string): Promise<Team | null> {
    return await this.repository
      .createQueryBuilder('team')
      .leftJoinAndSelect('team.members', 'members')
      .leftJoinAndSelect('members.user', 'user')
      .innerJoinAndSelect('team.coach', 'coach')
      .where({ id })
      .andWhere('coach.id= :coachId', { coachId })
      .select([
        'team',
        'coach.id',
        'coach.name',
        'members.id',
        'members.email',
        'members.userId',
        'members.createdAt',
        'members.acceptedAt',
        'user.id',
        'user.name'
      ])
      .getOne();
  }

  async listCoachTeams(coachId: string): Promise<Team[]> {
    return await this.repository.find({ where: { coach: { id: coachId } } });
  }
}
