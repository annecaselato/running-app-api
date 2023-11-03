import { Field, ObjectType } from '@nestjs/graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { Team } from './team.entity';
import { User } from '../users/user.entity';

@Entity()
@ObjectType()
export class TeamMember extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  email: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.memberships, { onDelete: 'CASCADE' })
  user?: User;

  @Field(() => Team)
  @ManyToOne(() => Team, (team) => team.members, { onDelete: 'CASCADE' })
  team: Team;
}
