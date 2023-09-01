import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../../users/user.entity';

@ObjectType()
export class SignInResponse {
  @Field()
  access_token: string;

  @Field()
  user: User;
}
