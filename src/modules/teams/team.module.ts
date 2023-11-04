import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './team.entity';
import { TeamMember } from './team-member.entity';
import { User } from '../users/user.entity';
import { TeamResolver } from './team.resolver';
import { TeamMemberResolver } from './team-member.resolver';
import { TeamService } from './team.service';
import { TeamMemberService } from './team-member.service';

@Module({
  imports: [TypeOrmModule.forFeature([Team, TeamMember, User])],
  providers: [TeamResolver, TeamMemberResolver, TeamService, TeamMemberService]
})
export class TeamModule {}
