import { Field, ObjectType } from '@nestjs/graphql';
import { TeamMember } from '../team-member.entity';

@ObjectType()
export class AthleteTeams {
  @Field(() => [TeamMember])
  invitations: TeamMember[];

  @Field(() => [TeamMember])
  teams: TeamMember[];
}
