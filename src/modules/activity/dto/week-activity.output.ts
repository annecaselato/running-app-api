import { Field, ObjectType } from '@nestjs/graphql';
import { Activity } from '../activity.entity';

@ObjectType()
export class WeekActivity {
  @Field(() => String)
  day: string;

  @Field(() => [Activity])
  activities: Activity[];
}
