import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
}
