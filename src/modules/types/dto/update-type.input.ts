import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

@InputType()
export class UpdateTypeInput {
  @IsUUID()
  @Transform(({ value }) => value.trim())
  @Field()
  id: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  @Field()
  type: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value ? value.trim() : null))
  @Field({ nullable: true })
  description?: string;
}
