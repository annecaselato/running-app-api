import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { BadRequestException } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { TypeService } from './type.service';
import { Activity } from './activity.entity';
import { User } from '../users/user.entity';
import { CreateActivityInput, UpdateActivityInput } from './dto';
import { AuthUser } from '../../shared/decorators';
import { IDInput } from '../../shared/dto/id.input';

@Resolver(() => Activity)
export class ActivityResolver {
  constructor(
    private readonly activityService: ActivityService,
    private readonly typeService: TypeService
  ) {}

  @Mutation(() => Activity)
  async createActivity(
    @Args('createActivityInput') input: CreateActivityInput,
    @AuthUser() authUser: User
  ) {
    const type = await this.typeService.findById(input.typeId, authUser.id);
    if (!type) return new BadRequestException('Type not found');

    return await this.activityService.create(input, authUser, type);
  }

  @Mutation(() => Activity)
  async updateActivity(
    @Args('updateActivityInput') input: UpdateActivityInput,
    @AuthUser() authUser: User
  ) {
    const activity = await this.activityService.findById(input.id, authUser.id);
    if (!activity) return new BadRequestException('Activity not found');

    const type = await this.typeService.findById(input.typeId, authUser.id);
    if (!type) return new BadRequestException('Type not found');

    return await this.activityService.update(
      Object.assign(activity, { ...input, type })
    );
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

  @Query(() => Activity)
  async getActivity(
    @Args('getActivityInput') input: IDInput,
    @AuthUser() authUser: User
  ) {
    return (
      (await this.activityService.findById(input.id, authUser.id)) ||
      new BadRequestException('Activity not found')
    );
  }

  @Query(() => [Activity])
  async listActivities(@AuthUser() authUser: User) {
    return await this.activityService.list(authUser.id);
  }
}
