// Libraries
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Repository } from 'typeorm';
import { useContainer } from 'class-validator';
import { TestUtils } from './test-utils';
// Modules
import { ActivityModule } from '../src/modules/activity/activity.module';
import { TeamModule } from '../src/modules/teams/team.module';
import { UserModule } from '../src/modules/users/user.module';
// Entities
import { Activity } from '../src/modules/activity/activity.entity';
import { Team } from '../src/modules/teams/team.entity';
import { TeamMember } from '../src/modules/teams/team-member.entity';
import { User } from '../src/modules/users/user.entity';
// DTOs
import { CreateActivityInput } from '../src/modules/activity/dto';

describe('ActivityResolver E2E', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let activityRepository: Repository<Activity>;
  let teamRepository: Repository<Team>;
  let memberRepository: Repository<TeamMember>;

  beforeAll(async () => {
    const module = await new TestUtils().getModule(
      [ActivityModule, UserModule, TeamModule],
      []
    );

    app = module.createNestApplication();

    activityRepository = module.get('ActivityRepository');
    userRepository = module.get('UserRepository');
    teamRepository = module.get('TeamRepository');
    memberRepository = module.get('TeamMemberRepository');

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true })
    );

    await app.init();
    useContainer(app.select(ActivityModule), { fallbackOnErrors: true });
  });

  beforeEach(async () => {
    // Arrange
    await userRepository.query(
      'INSERT INTO "user"("id", "name", "email", "profile") VALUES ("user-id", "User", "user@email.com", "Athlete")'
    );

    await userRepository.query(
      'INSERT INTO "user"("id", "name", "email", "profile") VALUES ("coach-id", "Coach", "coach@email.com", "Coach")'
    );

    await userRepository.query(
      'INSERT INTO "user"("id", "name", "email", "profile") VALUES ("other-id", "Coach", "other@email.com", "Coach")'
    );

    await activityRepository.query(
      'INSERT INTO "activity"("id", "datetime", "status", "type", "userId") VALUES ("1e2e860e-befa-4407-83dd-84fa1d2b1e12", datetime("now"), "Planned", "Long Run", "user-id")'
    );

    await teamRepository.query(
      'INSERT INTO "team"("id", "name", "coachId") VALUES ("1e2e860e-befa-4407-83dd-84fa1d2b1e31", "Test team", "coach-id")'
    );

    await memberRepository.query(
      'INSERT INTO "team_member"("id", "email", "teamId", "userId") VALUES ("1e2e860e-befa-4407-83dd-84fa1d2b1e21", "member1@example.com", "1e2e860e-befa-4407-83dd-84fa1d2b1e31", "user-id")'
    );
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await activityRepository.query('DELETE FROM activity');
    await memberRepository.query('DELETE FROM team_member');
    await teamRepository.query('DELETE FROM team');
    await userRepository.query('DELETE FROM user');
  });

  describe('createActivity', () => {
    const createActivityInput: CreateActivityInput = {
      datetime: new Date().toISOString(),
      status: 'Planned',
      type: 'Run',
      goalDistance: 5.0,
      distance: 2.5,
      goalDuration: '00:30:00',
      duration: '00:20:00'
    };

    const query = `
      mutation ($createActivityInput: CreateActivityInput!) {
        createActivity(createActivityInput: $createActivityInput) {
          id
        }
      }
    `;

    it('should create activity if all parameters are valid', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(app, query, {
        createActivityInput
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.createActivity).toBeTruthy();
    });

    it('should create activity if user is team members coach', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(
        app,
        query,
        {
          createActivityInput: {
            ...createActivityInput,
            memberId: '1e2e860e-befa-4407-83dd-84fa1d2b1e21'
          }
        },
        'coach-id'
      );

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.createActivity).toBeTruthy();
    });

    it('should return error if user is not members team coach', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(
        app,
        query,
        {
          createActivityInput: {
            ...createActivityInput,
            memberId: '1e2e860e-befa-4407-83dd-84fa1d2b1e21'
          }
        },
        'other-id'
      );

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeTruthy();
      expect(response.body.data).toBeFalsy();
    });
  });

  describe('updateActivity', () => {
    const updateActivityInput = {
      id: '1e2e860e-befa-4407-83dd-84fa1d2b1e12',
      datetime: new Date().toISOString(),
      status: 'Completed',
      type: 'Walk'
    };

    const query = `
      mutation ($updateActivityInput: UpdateActivityInput!) {
        updateActivity(updateActivityInput: $updateActivityInput) {
          id
          status
        }
      }
    `;

    it('should update activity if the activity exist', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(app, query, {
        updateActivityInput
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.updateActivity.status).toBe('Completed');
    });

    it('should update activity if user is team members coach', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(
        app,
        query,
        {
          updateActivityInput: {
            ...updateActivityInput,
            memberId: '1e2e860e-befa-4407-83dd-84fa1d2b1e21'
          }
        },
        'coach-id'
      );

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.updateActivity).toBeTruthy();
    });

    it('should return an error if the activity does not exist', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(app, query, {
        updateActivityInput: {
          ...updateActivityInput,
          id: '1e2e860e-befa-4407-83dd-84fa1d2b1e11'
        }
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual('Activity not found');
    });

    it('should return error if user is not members team coach', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(
        app,
        query,
        {
          updateActivityInput: {
            ...updateActivityInput,
            memberId: '1e2e860e-befa-4407-83dd-84fa1d2b1e21'
          }
        },
        'other-id'
      );

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeTruthy();
      expect(response.body.data).toBeFalsy();
    });
  });

  describe('deleteActivity', () => {
    const deleteActivityInput = {
      id: '1e2e860e-befa-4407-83dd-84fa1d2b1e12'
    };

    const query = `
      mutation ($deleteActivityInput: DeleteActivityInput!) {
        deleteActivity(deleteActivityInput: $deleteActivityInput)
      }
    `;

    it('should delete activity if it exists', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(app, query, {
        deleteActivityInput
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.deleteActivity).toEqual(
        '1e2e860e-befa-4407-83dd-84fa1d2b1e12'
      );
    });

    it('should delete activity if user is team members coach', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(
        app,
        query,
        {
          deleteActivityInput: {
            ...deleteActivityInput,
            memberId: '1e2e860e-befa-4407-83dd-84fa1d2b1e21'
          }
        },
        'coach-id'
      );

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.deleteActivity).toEqual(
        '1e2e860e-befa-4407-83dd-84fa1d2b1e12'
      );
    });

    it('should not return an error if the activity does not exist', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(app, query, {
        deleteActivityInput: { id: '1e2e860e-befa-4407-83dd-84fa1d2b1e11' }
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
    });

    it('should return error if user is not members team coach', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(
        app,
        query,
        {
          deleteActivityInput: {
            ...deleteActivityInput,
            memberId: '1e2e860e-befa-4407-83dd-84fa1d2b1e21'
          }
        },
        'other-id'
      );

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeTruthy();
      expect(response.body.data).toBeFalsy();
    });
  });

  describe('listActivities', () => {
    const listActivitiesInput = {};

    const query = `
      query ($listActivitiesInput: MemberIDInput!) {
        listActivities(listActivitiesInput: $listActivitiesInput) {
          rows {
            id
          }
          user
        }
      }
    `;

    it('should retrieve a list of activities', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(app, query, {
        listActivitiesInput
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.listActivities.rows.length).toBeGreaterThan(0);
    });

    it('should list activities if user is team members coach', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(
        app,
        query,
        {
          listActivitiesInput: {
            ...listActivitiesInput,
            memberId: '1e2e860e-befa-4407-83dd-84fa1d2b1e21'
          }
        },
        'coach-id'
      );

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.listActivities.rows.length).toBeGreaterThan(0);
    });

    it('should return error if user is not members team coach', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(
        app,
        query,
        {
          listActivitiesInput: {
            ...listActivitiesInput,
            memberId: '1e2e860e-befa-4407-83dd-84fa1d2b1e21'
          }
        },
        'other-id'
      );

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeTruthy();
      expect(response.body.data).toBeFalsy();
    });
  });

  describe('listWeekActivities', () => {
    const query = `
      query ($input: WeekActivityInput!) {
        listWeekActivities(listWeekActivitiesInput: $input) {
          day
          activities {
            id
            datetime
            status
            type
            goalDistance
            distance
            goalDuration
            duration
          }
        }
      }
    `;

    it('should retrieve a list of activities', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(app, query, {
        input: { startAt: new Date() }
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.listWeekActivities.length).toBeGreaterThan(0);
    });
  });
});
