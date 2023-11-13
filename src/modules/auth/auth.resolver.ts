import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import {
  RequestRecoveryInput,
  ResetPasswordInput,
  SignInInput,
  SignInOIDCInput,
  SignInResponse,
  UpdatePasswordInput
} from './dto';
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

  @PublicRoute()
  @Mutation(() => SignInResponse)
  signInOIDC(@Args('signInOIDCInput') signInOIDCInput: SignInOIDCInput) {
    return this.authService.signInOIDC(signInOIDCInput.token);
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

  @PublicRoute()
  @Mutation(() => Boolean)
  async requestRecovery(
    @Args('requestRecoveryInput') input: RequestRecoveryInput
  ) {
    await this.authService.requestRecovery(input.email);
    return true;
  }

  @PublicRoute()
  @Mutation(() => Boolean)
  async resetPassword(@Args('resetPasswordInput') input: ResetPasswordInput) {
    await this.authService.passwordRecovery(input.token, input.password);
    return true;
  }
}
