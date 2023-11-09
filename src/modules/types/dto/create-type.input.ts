import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

@InputType()
export class CreateTypeInput {
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @Field()
  type: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value ? value.trim() : null))
  @Field({ nullable: true })
  description?: string;
}
