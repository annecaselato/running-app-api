import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../users/user.service';
import { SignInInputDto } from './dto/sign-in-input.dto';
import { SignInResponseDto } from './dto/sign-in-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private jwtService: JwtService
  ) {}

  async signIn(input: SignInInputDto): Promise<SignInResponseDto> {
    const user = await this.userService.findOneByEmail(input.email);

    if (!user) throw new UnauthorizedException();

    const samePassword = await bcrypt.compare(input.password, user.password);

    if (!samePassword) throw new UnauthorizedException();

    const payload = { sub: user.id, name: user.name, email: user.email };

    return {
      access_token: await this.jwtService.signAsync(payload)
    };
  }
}
