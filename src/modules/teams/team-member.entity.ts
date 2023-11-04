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

  @Field({ nullable: true })
  @Column({ nullable: true })
  acceptedAt: Date;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, (user) => user.memberships, {
    nullable: true,
    onDelete: 'CASCADE'
  })
  user?: User;

  @Field(() => Team)
  @ManyToOne(() => Team, (team) => team.members, { onDelete: 'CASCADE' })
  team: Team;
}
