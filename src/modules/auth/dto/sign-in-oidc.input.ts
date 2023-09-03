import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class SignInOIDCInput {
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @Field()
  token: string;
}
