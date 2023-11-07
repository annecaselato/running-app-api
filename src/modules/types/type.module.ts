import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityType } from '../types/activity-type.entity';
import { User } from '../users/user.entity';
import { TypeResolver } from '../types/type.resolver';
import { TypeService } from '../types/type.service';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityType, User])],
  providers: [TypeResolver, TypeService]
})
export class TypeModule {}
