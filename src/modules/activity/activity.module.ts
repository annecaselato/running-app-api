import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './activity.entity';
import { ActivityResolver } from './activity.resolver';
import { ActivityService } from './activity.service';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Activity, User])],
  providers: [ActivityResolver, ActivityService]
})
export class ActivityModule {}
