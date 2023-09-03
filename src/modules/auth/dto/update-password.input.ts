import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

@InputType()
export class UpdatePasswordInput {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  @Field()
  oldPassword: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  @Transform(({ value }) => value.trim())
  @Field()
  newPassword: string;
}
