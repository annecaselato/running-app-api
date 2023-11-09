import { InputType, Field } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

import { Transform } from 'class-transformer';

@InputType()
export class UpdateProfileInput {
  @IsString()
  @IsNotEmpty()
  @IsIn(['Athlete', 'Coach'])
  @Transform(({ value }) => value.trim())
  @Field()
  profile: string;
}
