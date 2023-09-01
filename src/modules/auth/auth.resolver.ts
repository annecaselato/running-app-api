import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { SignInInput, SignInResponse, UpdatePasswordInput } from './dto';
import { AuthUser, PublicRoute } from '../../shared/decorators';
import { User } from '../users/user.entity';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @PublicRoute()
  @Mutation(() => SignInResponse)
  signIn(@Args('signInInput') signInInput: SignInInput) {
    return this.authService.signIn(signInInput);
  }

  @Mutation(() => String)
  async updatePassword(
    @Args('updatePasswordInput') updatePasswordInput: UpdatePasswordInput,
    @AuthUser() authUser: User
  ) {
    const updatedUser = await this.authService.updatePassword(
      authUser.id,
      updatePasswordInput
    );
    return updatedUser.id;
  }
}
