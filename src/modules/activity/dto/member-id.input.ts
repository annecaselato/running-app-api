import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

@InputType()
export class MemberIDInput {
  @IsUUID()
  @IsOptional()
  @Transform(({ value }) => value.trim())
  @Field({ nullable: true })
  memberId?: string;
}
