import { Query, Resolver } from '@nestjs/graphql';
import { PublicRoute } from '../../shared/decorators';

@PublicRoute()
@Resolver()
export class HealthResolver {
  @Query(() => String)
  checkHealth(): string {
    return 'OK';
  }
}
