import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from './user.entity';
import { UserService } from './user.service';
import { CreateUserInput, UpdateProfileInput, UpdateUserInput } from './dto';
import { AuthUser, PublicRoute } from '../../shared/decorators';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @PublicRoute()
  @Mutation(() => User)
  async createUser(@Args('createUserInput') input: CreateUserInput) {
    const { name, email, password } = input;
    return await this.userService.create(name, email, password);
  }

  @Mutation(() => User)
  async updateUser(
    @Args('updateUserInput') input: UpdateUserInput,
    @AuthUser() authUser: User
  ) {
    return await this.userService.update(authUser.id, input);
  }

  @Mutation(() => User)
  async updateProfile(
    @Args('updateProfileInput') input: UpdateProfileInput,
    @AuthUser() authUser: User
  ) {
    const user = await this.userService.updateProfile(
      authUser.id,
      input.profile
    );

    return Object.assign(authUser, user);
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
