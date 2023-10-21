import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './activity.entity';
import { ActivityResolver } from './activity.resolver';
import { ActivityService } from './activity.service';
import { ActivityType } from './activity-type.entity';
import { User } from '../users/user.entity';
import { TypeResolver } from './type.resolver';
import { TypeService } from './type.service';

@Module({
  imports: [TypeOrmModule.forFeature([Activity, ActivityType, User])],
  providers: [ActivityResolver, ActivityService, TypeResolver, TypeService]
})
export class ActivityModule {}
