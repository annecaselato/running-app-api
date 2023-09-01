import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from './user.entity';
import { UserService } from './user.service';
import { CreateUserInput, UpdateUserInput } from './dto';
import { AuthUser, PublicRoute } from '../../shared/decorators';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @PublicRoute()
  @Mutation(() => User)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.userService.create(createUserInput);
  }

  @Mutation(() => User)
  async updateUser(
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
    @AuthUser() authUser: User
  ) {
    return await this.userService.update(authUser.id, updateUserInput);
  }

  @Mutation(() => String)
  async deleteUser(@AuthUser() authUser: User) {
    await this.userService.delete(authUser.id);
    return authUser.id;
  }

  @Query(() => User)
  me(@AuthUser() authUser: User): User {
    return authUser;
  }
}
