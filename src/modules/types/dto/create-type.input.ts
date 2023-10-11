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
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @IsOptional()
  @Field({ nullable: true })
  description?: string;
}
