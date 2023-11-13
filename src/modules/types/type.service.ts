import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { ActivityType } from './activity-type.entity';
import { CreateTypeInput } from './dto';
import { User } from '../users/user.entity';

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
    return await this.typeRepository.findOne({
      where: { id, user: { id: userId } }
    });
  }

  async findByType(
    type: string,
    userId: string
  ): Promise<ActivityType | undefined> {
    return await this.typeRepository.findOne({
      where: { type, user: { id: userId } }
    });
  }

  async list(userId: string): Promise<ActivityType[]> {
    return await this.typeRepository.find({ where: { user: { id: userId } } });
  }
}
