import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsJWT, IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

@InputType()
export class ResetPasswordInput {
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @IsJWT()
  @Field()
  token: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  @Transform(({ value }) => value.trim())
  @Field()
  password: string;
}
