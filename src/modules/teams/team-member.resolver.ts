import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { BadRequestException } from '@nestjs/common';
import { User } from '../users/user.entity';
import { AuthRoles, AuthUser } from '../../shared/decorators';
import { Role } from '../../shared/models/roles';
import { IDInput } from '../../shared/dto/id.input';
import { TeamMember } from './team-member.entity';
import { TeamMemberService } from './team-member.service';
import { CreateMembersInput } from './dto';
import { TeamService } from './team.service';
import { Team } from './team.entity';
import { AthleteTeams } from './dto/athlete-teams.output';

@Resolver(() => TeamMember)
export class TeamMemberResolver {
  constructor(
    private readonly memberService: TeamMemberService,
    private readonly teamService: TeamService
  ) {}

  @AuthRoles(Role.COACH)
  @Mutation(() => Team)
  async createMembers(
    @Args('createMembersInput') input: CreateMembersInput,
    @AuthUser() authUser: User
  ) {
    const { id, members } = input;
    const team = await this.teamService.findById(id, authUser.id);

    if (!team) {
      return new BadRequestException('Team not found');
    }

    members.forEach(async (member) => {
      const teamMember = team.members.find((item) => item.email === member);

      if (!teamMember) {
        await this.memberService.create(member, team);
      }
    });

    return team;
  }

  @AuthRoles(Role.ATHLETE)
  @Mutation(() => TeamMember)
  async acceptInvitation(
    @Args('acceptInvitationInput') input: IDInput,
    @AuthUser() authUser: User
  ) {
    const { id } = input;
    const member = await this.memberService.findById(id);

    if (!member || member.email !== authUser.email) {
      return new BadRequestException('Team not found');
    }

    return await this.memberService.update(
      Object.assign(member, { user: authUser, acceptedAt: new Date() })
    );
  }

  @Mutation(() => String)
  async deleteMember(
    @Args('deleteMemberInput') input: IDInput,
    @AuthUser() authUser: User
  ) {
    const { id } = input;
    const member = await this.memberService.findById(id);

    if (
      member &&
      (member.team.coach.id === authUser.id || member.email === authUser.email)
    ) {
      await this.memberService.delete(id);
    }

    return id;
  }

  @AuthRoles(Role.ATHLETE)
  @Query(() => AthleteTeams)
  async listAthleteTeams(@AuthUser() authUser: User) {
    const invitations = await this.memberService.listInvitations(
      authUser.email
    );
    const teams = await this.memberService.listAthleteTeams(authUser.id);

    return { invitations, teams };
  }
}
