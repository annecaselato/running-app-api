import { Field, ObjectType } from '@nestjs/graphql';
import { Activity } from '../activity.entity';

@ObjectType()
export class WeekActivity {
  @Field(() => Date)
  day: Date;

  @Field(() => [Activity])
  activities: Activity[];
}
