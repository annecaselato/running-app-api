import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class HealthResolver {
  @Query(() => String)
  checkHealth(): string {
    return 'OK';
  }
}
