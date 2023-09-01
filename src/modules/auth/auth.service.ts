import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../users/user.service';
import { SignInInput, SignInResponse } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private jwtService: JwtService
  ) {}

  async signIn(input: SignInInput): Promise<SignInResponse> {
    const user = await this.userService.findOneByEmail(input.email);
    if (!user) throw new UnauthorizedException('Wrong email or password');

    const samePassword = await bcrypt.compare(input.password, user.password);

    if (!samePassword)
      throw new UnauthorizedException('Wrong email or password');

    const payload = { sub: user.id };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user
    };
  }
}
