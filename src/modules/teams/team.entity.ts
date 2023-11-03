import { Field, ObjectType } from '@nestjs/graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { TeamMember } from './team-member.entity';
import { User } from '../users/user.entity';

@Entity()
@ObjectType()
export class Team extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => User)
  @ManyToOne(() => User, (coach) => coach.teams, { onDelete: 'CASCADE' })
  coach: User;

  @Field(() => [TeamMember])
  @OneToMany(() => TeamMember, (members) => members.team, {
    cascade: true
  })
  members: TeamMember[];
}
