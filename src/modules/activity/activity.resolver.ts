import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { BadRequestException } from '@nestjs/common';
import { Activity } from './activity.entity';
import { User } from '../users/user.entity';
import {
  CreateActivityInput,
  DeleteActivityInput,
  MemberIDInput,
  UpdateActivityInput,
  UserActivity,
  WeekActivityInput
} from './dto';
import { ActivityService } from './activity.service';
import { TeamMemberService } from '../teams/team-member.service';
import { AuthUser } from '../../shared/decorators';
import { WeekActivity } from './dto/week-activity.output';

@Resolver(() => Activity)
export class ActivityResolver {
  constructor(
    private readonly activityService: ActivityService,
    private readonly memberService: TeamMemberService
  ) {}

  @Mutation(() => Activity)
  async createActivity(
    @Args('createActivityInput') input: CreateActivityInput,
    @AuthUser() authUser: User
  ) {
    let user: User;

    if (input.memberId) {
      const member = await this.memberService.findById(input.memberId);

      if (!member || member.team.coach.id !== authUser.id) {
        return new BadRequestException('Team member not found');
      }

      user = member.user;
      delete input.memberId;
    } else {
      user = authUser;
    }

    return await this.activityService.create(input, user);
  }

  @Mutation(() => Activity)
  async updateActivity(
    @Args('updateActivityInput') input: UpdateActivityInput,
    @AuthUser() authUser: User
  ) {
    const { id, memberId } = input;
    let userId: string;

    if (memberId) {
      const member = await this.memberService.findById(memberId);

      if (!member || member.team.coach.id !== authUser.id) {
        return new BadRequestException('Team member not found');
      }

      userId = member.user.id;
    } else {
      userId = authUser.id;
    }

    const activity = await this.activityService.findById(id, userId);

    if (!activity) return new BadRequestException('Activity not found');

    return await this.activityService.update(Object.assign(activity, input));
  }

  @Mutation(() => String)
  async deleteActivity(
    @Args('deleteActivityInput') input: DeleteActivityInput,
    @AuthUser() authUser: User
  ) {
    const { id, memberId } = input;
    let userId: string;

    if (memberId) {
      const member = await this.memberService.findById(memberId);

      if (!member || member.team.coach.id !== authUser.id) {
        return new BadRequestException('Team member not found');
      }

      userId = member.user.id;
    } else {
      userId = authUser.id;
    }

    const activity = await this.activityService.findById(id, userId);

    if (activity) {
      await this.activityService.delete(input.id);
    }

    return input.id;
  }

  @Query(() => UserActivity)
  async listActivities(
    @Args('listActivitiesInput') input: MemberIDInput,
    @AuthUser() authUser: User
  ) {
    let user: User;

    if (input.memberId) {
      const member = await this.memberService.findById(input.memberId);

      if (!member || member.team.coach.id !== authUser.id) {
        return new BadRequestException('Team member not found');
      }

      user = member.user;
    } else {
      user = authUser;
    }

    return { rows: await this.activityService.list(user.id), user: user.name };
  }

  @Query(() => [WeekActivity])
  async listWeekActivities(
    @Args('listWeekActivitiesInput') input: WeekActivityInput,
    @AuthUser() authUser: User
  ) {
    return await this.activityService.listWeek(authUser.id, input.startAt);
  }
}
