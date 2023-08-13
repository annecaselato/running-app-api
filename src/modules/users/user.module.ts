import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { IsUniqueEmailConstraint } from './validators/EmailValidator';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UserResolver, UserService, IsUniqueEmailConstraint],
})
export class UserModule {}
