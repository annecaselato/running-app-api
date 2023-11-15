import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DeleteResult, Repository } from 'typeorm';
import { Activity } from './activity.entity';
import { User } from '../users/user.entity';
import { CreateActivityInput, WeekActivity } from './dto';
import { DateUtil } from '../../utils/date.util';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>
  ) {}

  async create(input: CreateActivityInput, user: User): Promise<Activity> {
    const newActivity = this.activityRepository.create({
      ...input,
      user
    });
    return await this.activityRepository.save(newActivity);
  }

  async update(activity: Activity): Promise<Activity> {
    return this.activityRepository.save(activity);
  }

  async delete(id: string): Promise<DeleteResult> {
    return this.activityRepository.delete(id);
  }

  async findById(id: string, userId: string): Promise<Activity | undefined> {
    return await this.activityRepository.findOne({
      where: { id, user: { id: userId } }
    });
  }

  async list(userId: string): Promise<Activity[]> {
    return await this.activityRepository.find({
      where: { user: { id: userId } }
    });
  }

  async listWeek(userId: string, startAt: Date): Promise<WeekActivity[]> {
    const days = DateUtil.getDays(startAt, 7);
    const weekActivities = days.map((day) => ({
      day: day,
      activities: []
    }));

    const list = await this.activityRepository.find({
      where: { user: { id: userId }, datetime: Between(days[0], days[6]) }
    });

    list.forEach((activity) => {
      const timezoneOffset = startAt.getHours();

      const activityDay = new Date(
        activity.datetime.getFullYear(),
        activity.datetime.getMonth(),
        activity.datetime.getDate(),
        activity.datetime.getHours() - timezoneOffset,
        activity.datetime.getMinutes()
      );

      const day = weekActivities.find(
        (date) => date.day.toDateString() === activityDay.toDateString()
      );

      if (day) {
        day.activities.push(activity);
      }
    });

    return weekActivities;
  }
}
