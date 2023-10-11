import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityType } from './activity-type.entity';
import { TypeService } from './type.service';
import { TypeResolver } from './type.resolver';
import { User } from '../users/user.entity';
import { Activity } from '../activity/activity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Activity, ActivityType, User])],
  providers: [TypeResolver, TypeService]
})
export class TypeModule {}
