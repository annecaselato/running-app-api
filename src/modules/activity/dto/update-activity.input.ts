import { InputType, Field } from '@nestjs/graphql';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID
} from 'class-validator';
import { Transform } from 'class-transformer';

@InputType()
export class UpdateActivityInput {
  @IsUUID()
  @Transform(({ value }) => value.trim())
  @Field()
  id: string;

  @IsUUID()
  @IsOptional()
  @Transform(({ value }) => value.trim())
  @Field({ nullable: true })
  memberId?: string;

  @IsDate()
  @Field()
  datetime: Date;

  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @Field()
  status: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @Field()
  type: string;

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
