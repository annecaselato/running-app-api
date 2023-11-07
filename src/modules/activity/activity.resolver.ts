import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { BadRequestException } from '@nestjs/common';
import { Activity } from './activity.entity';
import { User } from '../users/user.entity';
import { CreateActivityInput, UpdateActivityInput } from './dto';
import { ActivityService } from './activity.service';
import { AuthUser } from '../../shared/decorators';
import { IDInput } from 'shared/dto/id.input';

@Resolver(() => Activity)
export class ActivityResolver {
  constructor(private readonly activityService: ActivityService) {}

  @Mutation(() => Activity)
  async createActivity(
    @Args('createActivityInput') input: CreateActivityInput,
    @AuthUser() authUser: User
  ) {
    return await this.activityService.create(input, authUser);
  }

  @Mutation(() => Activity)
  async updateActivity(
    @Args('updateActivityInput') input: UpdateActivityInput,
    @AuthUser() authUser: User
  ) {
    const activity = await this.activityService.findById(input.id, authUser.id);
    if (!activity) return new BadRequestException('Activity not found');

    return await this.activityService.update(Object.assign(activity, input));
  }

  @Mutation(() => String)
  async deleteActivity(
    @Args('deleteActivityInput') input: IDInput,
    @AuthUser() authUser: User
  ) {
    const activity = await this.activityService.findById(input.id, authUser.id);

    if (activity) {
      await this.activityService.delete(input.id);
    }

    return input.id;
  }

  @Query(() => [Activity])
  async listActivities(@AuthUser() authUser: User) {
    return await this.activityService.list(authUser.id);
  }
}
