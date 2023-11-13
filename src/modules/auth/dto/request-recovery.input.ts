import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class RequestRecoveryInput {
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @IsEmail()
  @Field()
  email: string;
}
