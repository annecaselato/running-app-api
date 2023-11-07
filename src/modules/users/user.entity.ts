import { ObjectType, Field } from '@nestjs/graphql';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Activity } from '../activity/activity.entity';
import { ActivityType } from '../types/activity-type.entity';
import { Team } from '../teams/team.entity';
import { TeamMember } from '../teams/team-member.entity';

@Entity()
@ObjectType()
export class User {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column()
  email: string;

  @Column({ nullable: true })
  password?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  profile?: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => [Activity])
  @OneToMany(() => Activity, (activity) => activity.user, {
    cascade: true
  })
  activities: Activity[];

  @Field(() => [ActivityType])
  @OneToMany(() => ActivityType, (type) => type.user, {
    cascade: true
  })
  types: ActivityType[];

  @Field(() => [Team])
  @OneToMany(() => Team, (team) => team.coach, {
    cascade: true
  })
  teams: Team[];

  @Field(() => [TeamMember])
  @OneToMany(() => TeamMember, (membership) => membership.user, {
    cascade: true
  })
  memberships: TeamMember[];

  @BeforeInsert()
  public async hashPassword(): Promise<void> {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
}
