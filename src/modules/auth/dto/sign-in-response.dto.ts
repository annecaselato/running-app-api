import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SignInResponseDto {
  @Field()
  access_token: string;
}
