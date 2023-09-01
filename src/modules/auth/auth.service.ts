import {
  BadRequestException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { UserService } from '../users/user.service';
import { SignInInput, SignInResponse, UpdatePasswordInput } from './dto';

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

  async updatePassword(id: string, input: UpdatePasswordInput): Promise<User> {
    const user = await this.userService.findOneById(id);
    if (!user) throw new UnauthorizedException('Invalid user');

    const samePassword = await bcrypt.compare(input.oldPassword, user.password);
    if (!samePassword) throw new BadRequestException('Wrong password');

    const newHash = await bcrypt.hash(input.newPassword, 10);
    return this.userService.updatePassword(id, newHash);
  }
}
