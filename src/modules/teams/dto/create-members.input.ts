import { InputType, Field } from '@nestjs/graphql';
import { IsArray, IsEmail, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

@InputType()
export class CreateMembersInput {
  @IsUUID()
  @Transform(({ value }) => value.trim())
  @Field()
  id: string;

  @IsArray()
  @IsEmail({}, { each: true })
  @Field(() => [String])
  members: string[];
}
