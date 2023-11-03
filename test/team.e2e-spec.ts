import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Repository } from 'typeorm';
import { useContainer } from 'class-validator';
import { CreateTeamInput } from '../src/modules/teams/dto';
import { Team } from '../src/modules/teams/team.entity';
import { TeamMember } from '../src/modules/teams/team-member.entity';
import { User } from '../src/modules/users/user.entity';
import { TeamModule } from '../src/modules/teams/team.module';
import { UserModule } from '../src/modules/users/user.module';
import { TestUtils } from './test-utils';

describe('TeamResolver E2E', () => {
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
      'INSERT INTO "user"("id", "name", "email", "profile") VALUES ("user-id", "User", "user@email.com", "Coach")'
    );

    await teamRepository.query(
      'INSERT INTO "team"("id", "name", "coachId") VALUES ("1e2e860e-befa-4407-83dd-84fa1d2b1e12", "Test team", "user-id")'
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

  describe('createTeam', () => {
    const createTeamInput: CreateTeamInput = {
      name: 'New team',
      description: 'This is a test',
      members: ['member1@example.com']
    };

    const query = `
      mutation ($createTeamInput: CreateTeamInput!) {
        createTeam(createTeamInput: $createTeamInput) {
          id
        }
      }
    `;

    it('should create team if all parameters are valid', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(app, query, {
        createTeamInput
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.createTeam).toBeTruthy();
    });

    it('should return an error if user role is unauthorized', async () => {
      // Arrange
      await userRepository.query(
        'UPDATE user SET profile = "Athlete" WHERE id = "user-id"'
      );

      // Act
      const response = await new TestUtils().gqlRequest(app, query, {
        createTeamInput
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual('Unauthorized access');
    });

    it.each`
      field        | value          | error
      ${'name'}    | ${''}          | ${'name should not be empty'}
      ${'members'} | ${'invalid'}   | ${'each value in members must be an email'}
      ${'members'} | ${['invalid']} | ${'each value in members must be an email'}
    `(
      'should return an error if $field is invalid',
      async ({ field, value, error }) => {
        // Act
        const response = await new TestUtils().gqlRequest(app, query, {
          createTeamInput: {
            ...createTeamInput,
            [field]: value
          }
        });

        // Assert
        expect(response.status).toEqual(200);
        expect(response.body.errors[0].message).toEqual(error);
      }
    );
  });

  describe('updateTeam', () => {
    const updateTeamInput = {
      id: '1e2e860e-befa-4407-83dd-84fa1d2b1e12',
      name: 'Updated Team Name',
      description: 'Updated description'
    };

    const query = `
      mutation ($updateTeamInput: UpdateTeamInput!) {
        updateTeam(updateTeamInput: $updateTeamInput) {
          id
        }
      }
    `;

    it('should update the team if the user is authorized', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(app, query, {
        updateTeamInput
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.updateTeam).toBeTruthy();
    });

    it('should return an error if the team does not exist', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(app, query, {
        updateTeamInput: {
          ...updateTeamInput,
          id: '1e2e860e-befa-4407-83dd-84fa1d2b1e13'
        }
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual('Team not found');
    });

    it('should return an error if the user role is unauthorized', async () => {
      // Arrange
      await userRepository.query(
        'UPDATE user SET profile = "Athlete" WHERE id = "user-id"'
      );

      // Act
      const response = await new TestUtils().gqlRequest(app, query, {
        updateTeamInput
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual('Unauthorized access');
    });
  });

  describe('deleteTeam', () => {
    const deleteTeamInput = {
      id: '1e2e860e-befa-4407-83dd-84fa1d2b1e12'
    };

    const query = `
      mutation ($deleteTeamInput: IDInput!) {
        deleteTeam(deleteTeamInput: $deleteTeamInput)
      }
    `;

    it('should delete the team if the user is authorized', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(app, query, {
        deleteTeamInput
      });

      // Assert
      const deletedTeam = await teamRepository.findOne({
        where: { id: deleteTeamInput.id }
      });

      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(deletedTeam).toBeNull();
    });

    it('should return the team ID if the team does not exist', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(app, query, {
        deleteTeamInput: {
          ...deleteTeamInput,
          id: '1e2e860e-befa-4407-83dd-84fa1d2b1e13'
        }
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.data.deleteTeam).toEqual(
        '1e2e860e-befa-4407-83dd-84fa1d2b1e13'
      );
    });

    it('should return an error if the user role is unauthorized', async () => {
      // Arrange
      await userRepository.query(
        'UPDATE user SET profile = "Athlete" WHERE id = "user-id"'
      );

      // Act
      const response = await new TestUtils().gqlRequest(app, query, {
        deleteTeamInput
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual('Unauthorized access');
    });
  });

  describe('getTeam', () => {
    const getTeamInput = {
      id: '1e2e860e-befa-4407-83dd-84fa1d2b1e12'
    };

    const query = `
      query ($getTeamInput: IDInput!) {
        getTeam(getTeamInput: $getTeamInput) {
          id
          name
          description
        }
      }
    `;

    it('should retrieve the team if the user is authorized', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(app, query, {
        getTeamInput
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.getTeam).toBeTruthy();
      expect(response.body.data.getTeam.id).toEqual(getTeamInput.id);
    });

    it('should return an error if the team does not exist', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(app, query, {
        getTeamInput: {
          ...getTeamInput,
          id: '1e2e860e-befa-4407-83dd-84fa1d2b1e13'
        }
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual('Team not found');
    });

    it('should return an error if the user role is unauthorized', async () => {
      // Arrange
      await userRepository.query(
        'UPDATE user SET profile = "Athlete" WHERE id = "user-id"'
      );

      // Act
      const response = await new TestUtils().gqlRequest(app, query, {
        getTeamInput
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual('Unauthorized access');
    });
  });

  describe('listCoachTeams', () => {
    const query = `
      query {
        listCoachTeams {
          id
          name
        }
      }
    `;

    it("should retrieve the list of coach's teams if the user is authorized", async () => {
      // Act
      const response = await new TestUtils().gqlRequest(app, query, undefined);

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.listCoachTeams).toBeTruthy();
      expect(response.body.data.listCoachTeams.length).toBeGreaterThan(0);
    });

    it('should return an error if the user role is unauthorized', async () => {
      // Arrange
      await userRepository.query(
        'UPDATE user SET profile = "Athlete" WHERE id = "user-id"'
      );

      // Act
      const response = await new TestUtils().gqlRequest(app, query, undefined);

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual('Unauthorized access');
    });
  });
});
