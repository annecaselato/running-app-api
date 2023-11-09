import { InputType, Field } from '@nestjs/graphql';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString
} from 'class-validator';
import { Transform } from 'class-transformer';

@InputType()
export class CreateTeamInput {
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

  @IsArray()
  @IsEmail({}, { each: true })
  @Field(() => [String])
  members: string[];
}
