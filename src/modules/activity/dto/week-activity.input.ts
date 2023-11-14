import { InputType, Field } from '@nestjs/graphql';
import { IsDate } from 'class-validator';

@InputType()
export class WeekActivityInput {
  @IsDate()
  @Field()
  startAt: Date;
}
