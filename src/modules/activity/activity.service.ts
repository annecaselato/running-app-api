import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { Activity } from './activity.entity';
import { User } from '../users/user.entity';
import { CreateActivityInput } from './dto';

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
    return await this.activityRepository
      .createQueryBuilder('activity')
      .innerJoin('activity.user', 'user')
      .where({ id })
      .andWhere('user.id= :userId', { userId })
      .getOne();
  }

  async list(userId: string): Promise<Activity[]> {
    return await this.activityRepository
      .createQueryBuilder('activity')
      .innerJoin('activity.user', 'user')
      .where('user.id = :userId', { userId })
      .getMany();
  }
}
