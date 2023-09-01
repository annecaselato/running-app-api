import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from './user.entity';
import { UserService } from './user.service';
import { CreateUserInput } from './dto';
import { AuthUser, PublicRoute } from '../../shared/decorators';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @PublicRoute()
  @Mutation(() => User)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.userService.create(createUserInput);
  }

  @Query(() => User)
  me(@AuthUser() authUser: User): User {
    return authUser;
  }
}
