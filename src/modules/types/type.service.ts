import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { ActivityType } from './activity-type.entity';
import { User } from '../users/user.entity';
import { CreateTypeInput } from './dto';

@Injectable()
export class TypeService {
  constructor(
    @InjectRepository(ActivityType)
    private readonly typeRepository: Repository<ActivityType>
  ) {}

  async create(input: CreateTypeInput, user: User): Promise<ActivityType> {
    const newType = this.typeRepository.create({ ...input, user });
    return await this.typeRepository.save(newType);
  }

  async update(type: ActivityType): Promise<ActivityType> {
    return this.typeRepository.save(type);
  }

  async delete(id: string): Promise<DeleteResult> {
    return this.typeRepository.delete(id);
  }

  async findById(
    id: string,
    userId: string
  ): Promise<ActivityType | undefined> {
    return await this.typeRepository
      .createQueryBuilder('type')
      .innerJoin('type.user', 'user')
      .where({ id })
      .andWhere('user.id= :userId', { userId })
      .getOne();
  }

  async findByType(
    type: string,
    userId: string
  ): Promise<ActivityType | undefined> {
    return await this.typeRepository
      .createQueryBuilder('type')
      .innerJoin('type.user', 'user')
      .where({ type })
      .andWhere('user.id= :userId', { userId })
      .getOne();
  }

  async list(userId: string): Promise<ActivityType[]> {
    return await this.typeRepository
      .createQueryBuilder('type')
      .innerJoin('type.user', 'user')
      .where('user.id = :userId', { userId })
      .getMany();
  }
}
