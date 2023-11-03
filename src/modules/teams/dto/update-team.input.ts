import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

import { Transform } from 'class-transformer';

@InputType()
export class UpdateTeamInput {
  @IsUUID()
  @Transform(({ value }) => value.trim())
  @Field()
  id: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  @Field()
  name: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value ? value.trim() : null))
  @Field({ nullable: true })
  description?: string;
}
