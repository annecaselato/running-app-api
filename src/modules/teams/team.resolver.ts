import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { BadRequestException } from '@nestjs/common';
import { Team } from './team.entity';
import { TeamService } from './team.service';
import { CreateTeamInput, UpdateTeamInput } from './dto';
import { User } from '../users/user.entity';
import { AuthRoles, AuthUser } from '../../shared/decorators';
import { Role } from '../../shared/models/roles';
import { IDInput } from '../../shared/dto/id.input';
import { TeamMemberService } from './team-member.service';

@Resolver(() => Team)
export class TeamResolver {
  constructor(
    private readonly teamService: TeamService,
    private readonly memberService: TeamMemberService
  ) {}

  @AuthRoles(Role.COACH)
  @Mutation(() => Team)
  async createTeam(
    @Args('createTeamInput') input: CreateTeamInput,
    @AuthUser() authUser: User
  ) {
    const newTeam = await this.teamService.create(input, authUser);

    const emails = [...new Set(input.members)];

    emails.forEach(async (email) => {
      await this.memberService.create(email, newTeam);
    });

    return newTeam;
  }

  @AuthRoles(Role.COACH)
  @Mutation(() => Team)
  async updateTeam(
    @Args('updateTeamInput') input: UpdateTeamInput,
    @AuthUser() authUser: User
  ) {
    const team = await this.teamService.findById(input.id, authUser.id);

    if (!team) {
      return new BadRequestException('Team not found');
    }

    return await this.teamService.update(Object.assign(team, { ...input }));
  }

  @AuthRoles(Role.COACH)
  @Mutation(() => String)
  async deleteTeam(
    @Args('deleteTeamInput') input: IDInput,
    @AuthUser() authUser: User
  ) {
    const { id } = input;
    const team = await this.teamService.findById(id, authUser.id);

    if (team) {
      await this.teamService.delete(id);
    }

    return id;
  }

  @AuthRoles(Role.COACH)
  @Query(() => Team)
  async getTeam(
    @Args('getTeamInput') input: IDInput,
    @AuthUser() authUser: User
  ) {
    const team = await this.teamService.findById(input.id, authUser.id);

    if (!team) {
      return new BadRequestException('Team not found');
    }

    return team;
  }

  @AuthRoles(Role.COACH)
  @Query(() => [Team])
  async listCoachTeams(@AuthUser() authUser: User) {
    return await this.teamService.listCoachTeams(authUser.id);
  }
}
