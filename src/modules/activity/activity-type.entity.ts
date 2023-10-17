import { Field, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn
} from 'typeorm';
import { Activity } from './activity.entity';
import { User } from '../users/user.entity';

@Entity()
@ObjectType()
export class ActivityType {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  type: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @ManyToOne(() => User, (user) => user.types, { onDelete: 'CASCADE' })
  user: User;

  @Field(() => [Activity])
  @OneToMany(() => Activity, (activity) => activity.type)
  activities: Activity[];
}
