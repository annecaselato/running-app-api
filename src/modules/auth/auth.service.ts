import {
  JwtHeader,
  JwtPayload,
  SigningKeyCallback,
  verify
} from 'jsonwebtoken';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CertSigningKey, JwksClient, RsaSigningKey } from 'jwks-rsa';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from '../users/user.entity';
import { UserService } from '../users/user.service';
import { SignInInput, SignInResponse, UpdatePasswordInput } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private jwtService: JwtService,
    private readonly mailerService: MailerService
  ) {}

  private static validateIDToken(
    token: string
  ): Promise<string | JwtPayload | undefined> {
    const getKey = (header: JwtHeader, callback: SigningKeyCallback): void => {
      const client = new JwksClient({ jwksUri: process.env.GOOGLE_JWKS_URI });

      client.getSigningKey(header.kid, (_err, key) => {
        const publicKey =
          key &&
          ((key as CertSigningKey).publicKey ||
            (key as RsaSigningKey).rsaPublicKey);
        callback(null, publicKey);
      });
    };

    return new Promise((resolve) => {
      verify(
        token,
        getKey,
        { audience: process.env.GOOGLE_CLIENT_ID },
        (err, payload) => {
          if (err) {
            resolve(undefined);
          } else {
            resolve(payload);
          }
        }
      );
    });
  }

  async signIn(input: SignInInput): Promise<SignInResponse> {
    const user = await this.userService.findOneByEmail(input.email);

    if (!user || !user.password) {
      throw new UnauthorizedException('Wrong email or password');
    }

    const samePassword = await bcrypt.compare(input.password, user.password);

    if (!samePassword) {
      throw new UnauthorizedException('Wrong email or password');
    }

    return {
      access_token: await this.jwtService.signAsync({ sub: user.id }),
      user
    };
  }

  async signInOIDC(token: string): Promise<SignInResponse> {
    const payload = await AuthService.validateIDToken(token);

    if (!payload || typeof payload === 'string' || !payload.email)
      throw new UnauthorizedException('Invalid ID token');

    let user = await this.userService.findOneByEmail(payload.email);

    if (!user) {
      user = await this.userService.create(payload.name, payload.email);
    }

    return {
      access_token: await this.jwtService.signAsync({ sub: user.id }),
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

  async requestRecovery(email: string): Promise<void> {
    const user = await this.userService.findOneByEmail(email);

    if (user) {
      const recoveryToken = await this.jwtService.signAsync(
        { sub: user.id },
        { expiresIn: '30m' }
      );

      try {
        this.mailerService.sendMail({
          to: email,
          from: 'noreply@runquest.com',
          subject: 'Password Recovery',
          template: 'password-recovery',
          context: {
            name: user.name,
            link: `${process.env.PASSWORD_RECOVERY_URL}/${recoveryToken}`
          }
        });
      } catch (err) {
        console.log(err);
      }
    }
  }

  async passwordRecovery(token: string, password: string): Promise<void> {
    try {
      const { sub } = this.jwtService.verify(token);

      const user = await this.userService.findOneById(sub);

      if (!user) throw new BadRequestException();

      const newHash = await bcrypt.hash(password, 10);

      await this.userService.updatePassword(user.id, newHash);
    } catch {
      throw new BadRequestException('Invalid token');
    }
  }
}
