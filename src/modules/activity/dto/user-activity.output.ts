import { Field, ObjectType } from '@nestjs/graphql';
import { Activity } from '../activity.entity';

@ObjectType()
export class UserActivity {
  @Field(() => [Activity])
  rows: Activity[];

  @Field(() => String)
  user: string;
}
