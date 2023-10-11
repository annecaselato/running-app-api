import { ObjectType, Field } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { User } from '../users/user.entity';
import { ActivityType } from '../types/activity-type.entity';

@Entity()
@ObjectType()
export class Activity {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  datetime: Date;

  @Field()
  @Column()
  status: string;

  @Field()
  @Column()
  goalDistance?: number;

  @Field()
  @Column()
  distance?: number;

  @Field()
  @Column()
  goalDuration?: string;

  @Field()
  @Column()
  duration?: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.activities)
  user: User;

  @Field(() => ActivityType)
  @ManyToOne(() => ActivityType, (type) => type.activities)
  type: ActivityType;
}
