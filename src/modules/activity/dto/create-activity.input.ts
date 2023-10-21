import { InputType, Field } from '@nestjs/graphql';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID
} from 'class-validator';
import { Transform } from 'class-transformer';

@InputType()
export class CreateActivityInput {
  @IsDateString()
  @Field()
  datetime: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @Field()
  status: string;

  @IsUUID()
  @Transform(({ value }) => value.trim())
  @Field()
  typeId: string;

  @IsNumber()
  @IsOptional()
  @Field({ nullable: true })
  goalDistance?: number;

  @IsNumber()
  @IsOptional()
  @Field({ nullable: true })
  distance?: number;

  @IsString()
  @Transform(({ value }) => (value ? value.trim() : null))
  @IsOptional()
  @Field({ nullable: true })
  goalDuration?: string;

  @IsString()
  @Transform(({ value }) => (value ? value.trim() : null))
  @IsOptional()
  @Field({ nullable: true })
  duration?: string;
}
