import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, IsNull, Repository } from 'typeorm';
import { Team } from './team.entity';
import { TeamMember } from './team-member.entity';

@Injectable()
export class TeamMemberService {
  constructor(
    @InjectRepository(TeamMember)
    private readonly repository: Repository<TeamMember>
  ) {}

  async create(email: string, team: Team): Promise<TeamMember> {
    return await this.repository.save({ email, team });
  }

  async update(member: TeamMember): Promise<TeamMember> {
    return this.repository.save(member);
  }

  async delete(id: string): Promise<DeleteResult> {
    return this.repository.delete(id);
  }

  async findById(id: string): Promise<TeamMember | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['team', 'team.coach']
    });
  }

  async listInvitations(email: string): Promise<TeamMember[]> {
    return await this.repository.find({
      where: { email, acceptedAt: IsNull() },
      relations: ['team', 'team.coach']
    });
  }

  async listAthleteTeams(userId: string): Promise<TeamMember[]> {
    return await this.repository
      .createQueryBuilder('member')
      .leftJoinAndSelect('member.team', 'team')
      .leftJoinAndSelect('team.coach', 'coach')
      .innerJoinAndSelect('member.user', 'user')
      .where('user.id= :userId', { userId })
      .select(['member', 'team', 'coach.id', 'coach.name'])
      .getMany();
  }
}
