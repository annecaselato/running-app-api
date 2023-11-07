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
  type: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  goalDistance?: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  distance?: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  goalDuration?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  duration?: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.activities, { onDelete: 'CASCADE' })
  user: User;
}
