import { InputType, Field } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword
} from 'class-validator';

import { IsUniqueEmail } from '../validators/unique-email.validator';
import { Transform } from 'class-transformer';

@InputType()
export class CreateUserInput {
  @IsString()
  @IsEmail()
  @IsUniqueEmail()
  @Transform(({ value }) => value.trim())
  @Field()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  @Field()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  @Transform(({ value }) => value.trim())
  @Field()
  password: string;
}
