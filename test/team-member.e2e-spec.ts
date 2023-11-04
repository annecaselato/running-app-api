import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Repository } from 'typeorm';
import { useContainer } from 'class-validator';
import { CreateMembersInput } from '../src/modules/teams/dto';
import { Team } from '../src/modules/teams/team.entity';
import { TeamMember } from '../src/modules/teams/team-member.entity';
import { User } from '../src/modules/users/user.entity';
import { TeamModule } from '../src/modules/teams/team.module';
import { UserModule } from '../src/modules/users/user.module';
import { TestUtils } from './test-utils';

describe('TeamMemberResolver E2E', () => {
  let app: INestApplication;
  let teamRepository: Repository<Team>;
  let memberRepository: Repository<TeamMember>;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    const module = await new TestUtils().getModule(
      [TeamModule, UserModule],
      []
    );

    app = module.createNestApplication();

    teamRepository = module.get('TeamRepository');
    memberRepository = module.get('TeamMemberRepository');
    userRepository = module.get('UserRepository');

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true })
    );

    await app.init();
    useContainer(app.select(TeamModule), { fallbackOnErrors: true });
  });

  beforeEach(async () => {
    // Arrange
    await userRepository.query(
      'INSERT INTO "user"("id", "name", "email", "profile") VALUES ("coach-id", "Coach", "coach@email.com", "Coach")'
    );

    await userRepository.query(
      'INSERT INTO "user"("id", "name", "email", "profile") VALUES ("athlete-id", "Athlete", "member1@example.com", "Athlete")'
    );

    await teamRepository.query(
      'INSERT INTO "team"("id", "name", "coachId") VALUES ("1e2e860e-befa-4407-83dd-84fa1d2b1e12", "Test team", "coach-id")'
    );

    await memberRepository.query(
      'INSERT INTO "team_member"("id", "email", "teamId") VALUES ("1e2e860e-befa-4407-83dd-84fa1d2b1e21", "member1@example.com", "1e2e860e-befa-4407-83dd-84fa1d2b1e12")'
    );
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await memberRepository.query('DELETE FROM team_member');
    await teamRepository.query('DELETE FROM team');
    await userRepository.query('DELETE FROM user');
  });

  describe('createMembers', () => {
    const createMembersInput: CreateMembersInput = {
      id: '1e2e860e-befa-4407-83dd-84fa1d2b1e12',
      members: ['member1@example.com', 'member2@example.com']
    };

    const query = `
      mutation ($createMembersInput: CreateMembersInput!) {
        createMembers(createMembersInput: $createMembersInput) {
          id
        }
      }
    `;

    it('should create members if all parameters are valid', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(
        app,
        query,
        {
          createMembersInput
        },
        'coach-id'
      );

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.createMembers).toBeTruthy();
    });

    it('should return an error if user role is unauthorized', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(
        app,
        query,
        {
          createMembersInput
        },
        'athlete-id'
      );

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual('Unauthorized access');
    });

    it.each`
      field        | value                                     | error
      ${'id'}      | ${'invalid'}                              | ${'id must be a UUID'}
      ${'id'}      | ${'1e2e860e-befa-4407-83dd-84fa1d2b1e15'} | ${'Team not found'}
      ${'members'} | ${'invalid'}                              | ${'each value in members must be an email'}
      ${'members'} | ${['invalid']}                            | ${'each value in members must be an email'}
    `(
      'should return an error if $field is invalid',
      async ({ field, value, error }) => {
        // Act
        const response = await new TestUtils().gqlRequest(
          app,
          query,
          {
            createMembersInput: {
              ...createMembersInput,
              [field]: value
            }
          },
          'coach-id'
        );

        // Assert
        expect(response.status).toEqual(200);
        expect(response.body.errors[0].message).toEqual(error);
      }
    );
  });

  describe('acceptInvitation', () => {
    const acceptInvitationInput = {
      id: '1e2e860e-befa-4407-83dd-84fa1d2b1e21'
    };

    const query = `
      mutation ($acceptInvitationInput: IDInput!) {
        acceptInvitation(acceptInvitationInput: $acceptInvitationInput) {
          id
        }
      }
    `;

    it('should update the membership if the user is authorized', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(
        app,
        query,
        {
          acceptInvitationInput
        },
        'athlete-id'
      );

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.acceptInvitation).toBeTruthy();
    });

    it('should return an error if the member does not exist', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(
        app,
        query,
        {
          acceptInvitationInput: {
            id: '1e2e860e-befa-4407-83dd-84fa1d2b1e22'
          }
        },
        'athlete-id'
      );

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual('Team not found');
    });

    it('should return an error if the user is unauthorized', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(
        app,
        query,
        {
          acceptInvitationInput
        },
        'coach-id'
      );

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual('Unauthorized access');
    });
  });

  describe('deleteMember', () => {
    const deleteMemberInput = {
      id: '1e2e860e-befa-4407-83dd-84fa1d2b1e21'
    };

    const query = `
      mutation ($deleteMemberInput: IDInput!) {
        deleteMember(deleteMemberInput: $deleteMemberInput)
      }
    `;

    it('should delete the member if the user is an authorized coach', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(
        app,
        query,
        {
          deleteMemberInput
        },
        'coach-id'
      );

      // Assert
      const deletedMember = await memberRepository.findOne({
        where: { id: deleteMemberInput.id }
      });

      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(deletedMember).toBeNull();
    });

    it('should delete the member if the user is an authorized athlete', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(
        app,
        query,
        {
          deleteMemberInput
        },
        'athlete-id'
      );

      // Assert
      const deletedMember = await memberRepository.findOne({
        where: { id: deleteMemberInput.id }
      });

      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(deletedMember).toBeNull();
    });

    it('should return the ID if the member does not exist', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(
        app,
        query,
        {
          deleteMemberInput: {
            ...deleteMemberInput,
            id: '1e2e860e-befa-4407-83dd-84fa1d2b1e13'
          }
        },
        'coach-id'
      );

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.data.deleteMember).toEqual(
        '1e2e860e-befa-4407-83dd-84fa1d2b1e13'
      );
    });

    it('should not delete if the user is unauthorized', async () => {
      // Arrange
      await userRepository.query(
        'INSERT INTO "user"("id", "name", "email", "profile") VALUES ("user-id", "User", "user@email.com", "Coach")'
      );

      // Act
      const response = await new TestUtils().gqlRequest(
        app,
        query,
        {
          deleteMemberInput
        },
        'user-id'
      );

      // Assert
      const member = await memberRepository.findOne({
        where: { id: deleteMemberInput.id }
      });

      expect(response.status).toEqual(200);
      expect(member).not.toBeNull();
    });
  });

  describe('listAthleteTeams', () => {
    const query = `
      query {
        listAthleteTeams {
          invitations {
            id
            email
            team {
                id
                name
            }
          }
          teams {
            id
            email
            team {
                id
                name
            }
          }
        }
      }
    `;

    it("should retrieve the list of athlete's invitations and teams if the user is authorized", async () => {
      // Act
      const response = await new TestUtils().gqlRequest(
        app,
        query,
        undefined,
        'athlete-id'
      );

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.listAthleteTeams).toBeTruthy();
    });

    it('should return an error if the user role is unauthorized', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(
        app,
        query,
        undefined,
        'coach-id'
      );

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual('Unauthorized access');
    });
  });
});
