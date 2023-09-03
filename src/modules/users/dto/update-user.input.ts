import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

import { Transform } from 'class-transformer';

@InputType()
export class UpdateUserInput {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  @Field()
  name: string;
}
