import { InputType, Field } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword
} from 'class-validator';

import { IsUniqueEmail } from '../validators/EmailValidator';
import { Transform } from 'class-transformer';

@InputType()
export class CreateUserInput {
  @IsString()
  @IsEmail()
  @IsUniqueEmail()
  @Transform(({ value }) => value.trim())
  @Field({ description: 'user email' })
  email: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  @Field({ description: 'user first name' })
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  @Transform(({ value }) => value.trim())
  @Field({ description: 'user password' })
  password: string;
}
