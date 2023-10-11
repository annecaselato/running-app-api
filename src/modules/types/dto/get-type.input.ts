import { InputType, Field } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

@InputType()
export class GetTypeInput {
  @IsUUID()
  @Transform(({ value }) => value.trim())
  @Field()
  id: string;
}
