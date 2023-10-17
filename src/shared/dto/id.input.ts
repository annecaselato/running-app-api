import { InputType, Field } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

@InputType()
export class IDInput {
  @IsUUID()
  @Transform(({ value }) => value.trim())
  @Field()
  id: string;
}
