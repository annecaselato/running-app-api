import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateUserInput {
  @Field({ description: 'user email' })
  email: string;

  @Field({ description: 'user first name' })
  name: string;

  @Field({ description: 'user password' })
  password: string;
}
