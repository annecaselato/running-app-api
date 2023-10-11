import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { BadRequestException } from '@nestjs/common';
import { TypeService } from './type.service';
import { ActivityType } from './activity-type.entity';
import { CreateTypeInput, GetTypeInput, UpdateTypeInput } from './dto';
import { User } from '../users/user.entity';
import { AuthUser } from '../../shared/decorators';

@Resolver(() => ActivityType)
export class TypeResolver {
  constructor(private readonly typeService: TypeService) {}

  @Mutation(() => ActivityType)
  async createType(
    @Args('createTypeInput') input: CreateTypeInput,
    @AuthUser() authUser: User
  ) {
    const type = await this.typeService.findByType(input.type, authUser.id);

    if (type) return new BadRequestException('Type already exist');

    return await this.typeService.create(input, authUser);
  }

  @Mutation(() => ActivityType)
  async updateType(
    @Args('updateTypeInput') input: UpdateTypeInput,
    @AuthUser() authUser: User
  ) {
    const type = await this.typeService.findById(input.id, authUser.id);

    if (!type) return new BadRequestException('Type not found');

    return await this.typeService.update(Object.assign(type, { ...input }));
  }

  @Mutation(() => String)
  async deleteType(
    @Args('deleteTypeInput') input: GetTypeInput,
    @AuthUser() authUser: User
  ) {
    const type = await this.typeService.findById(input.id, authUser.id);

    if (type) {
      await this.typeService.delete(input.id);
    }

    return input.id;
  }

  @Query(() => ActivityType)
  async getType(
    @Args('getTypeInput') input: GetTypeInput,
    @AuthUser() authUser: User
  ) {
    return (
      (await this.typeService.findById(input.id, authUser.id)) ||
      new BadRequestException('Type not found')
    );
  }

  @Query(() => [ActivityType])
  async listTypes(@AuthUser() authUser: User) {
    return await this.typeService.list(authUser.id);
  }
}
