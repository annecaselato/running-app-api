import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { SignInInputDto } from './dto/sign-in-input.dto';
import { AuthService } from './auth.service';
import { SignInResponseDto } from './dto/sign-in-response.dto';
import { PublicRoute } from '../../shared/decorators/public-route.decorator';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @PublicRoute()
  @Mutation(() => SignInResponseDto)
  signIn(@Args('signInInput') signInInput: SignInInputDto) {
    return this.authService.signIn(signInInput);
  }
}
