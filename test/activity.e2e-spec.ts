import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as request from 'supertest';
import { useContainer } from 'class-validator';
import { ActivityType } from '../src/modules/activity/activity-type.entity';
import { CreateActivityInput } from '../src/modules/activity/dto';
import { Activity } from '../src/modules/activity/activity.entity';
import { User } from '../src/modules/users/user.entity';
import { ActivityModule } from '../src/modules/activity/activity.module';
import { UserModule } from '../src/modules/users/user.module';
import { TestUtils } from './test-utils';

describe('ActivityResolver E2E', () => {
  let app: INestApplication;
  let typeRepository: Repository<ActivityType>;
  let userRepository: Repository<User>;
  let activityRepository: Repository<Activity>;

  const generateAuthToken = (userId: string) => {
    const payload = { sub: userId, email: 'user@email.com', name: 'Test User' };
    return new JwtService().sign(payload, { secret: 'jwt-secret' });
  };

  const gqlRequestWithAuth = async (query: string, variables: any) => {
    const token = generateAuthToken('user-id');
    return request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send({
        query,
        variables
      });
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'jwt-secret';
    const module = await new TestUtils().getModule(
      [ActivityModule, UserModule],
      []
    );

    app = module.createNestApplication();

    typeRepository = module.get<Repository<ActivityType>>(
      'ActivityTypeRepository'
    );
    userRepository = module.get<Repository<User>>('UserRepository');

    activityRepository = module.get<Repository<Activity>>('ActivityRepository');

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true })
    );

    await app.init();
    useContainer(app.select(ActivityModule), { fallbackOnErrors: true });
  });

  beforeEach(async () => {
    // Arrange
    await userRepository.query(
      'INSERT INTO "user"("id", "name", "email", "createdAt", "updatedAt") VALUES ("user-id", "User", "user@email.com", datetime("now"), datetime("now"))'
    );

    await typeRepository.query(
      'INSERT INTO "activity_type"("id", "type", "description", "userId") VALUES ("1e2e860e-befa-4407-83dd-84fa1d2b1e65", "New Run", null, "user-id")'
    );

    await activityRepository.query(
      'INSERT INTO "activity"("id", "datetime", "status", "typeId", "userId") VALUES ("1e2e860e-befa-4407-83dd-84fa1d2b1e12", datetime("now"), "Planned", "1e2e860e-befa-4407-83dd-84fa1d2b1e65", "user-id")'
    );
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await activityRepository.query('DELETE FROM activity');
    await typeRepository.query('DELETE FROM activity_type');
    await userRepository.query('DELETE FROM user');
  });

  describe('createActivity', () => {
    const createActivityInput: CreateActivityInput = {
      datetime: new Date().toISOString(),
      status: 'Planned',
      typeId: '1e2e860e-befa-4407-83dd-84fa1d2b1e65',
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
      const response = await gqlRequestWithAuth(query, { createActivityInput });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.createActivity).toBeTruthy();
    });

    it('should return an error if the type does not exist', async () => {
      // Act
      const response = await gqlRequestWithAuth(query, {
        createActivityInput: {
          ...createActivityInput,
          typeId: '1e2e860e-befa-4407-83dd-84fa1d2b1e60'
        }
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual('Type not found');
    });
  });

  describe('updateActivity', () => {
    const updateActivityInput = {
      id: '1e2e860e-befa-4407-83dd-84fa1d2b1e12',
      datetime: new Date().toISOString(),
      status: 'Completed',
      typeId: '1e2e860e-befa-4407-83dd-84fa1d2b1e65'
    };

    const query = `
      mutation ($updateActivityInput: UpdateActivityInput!) {
        updateActivity(updateActivityInput: $updateActivityInput) {
          id
          status
        }
      }
    `;

    it('should update activity if the activity and type exist', async () => {
      // Act
      const response = await gqlRequestWithAuth(query, { updateActivityInput });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.updateActivity.status).toBe('Completed');
    });

    it('should return an error if the activity does not exist', async () => {
      // Act
      const response = await gqlRequestWithAuth(query, {
        updateActivityInput: {
          ...updateActivityInput,
          id: '1e2e860e-befa-4407-83dd-84fa1d2b1e11'
        }
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual('Activity not found');
    });

    it('should return an error if the type does not exist', async () => {
      // Act
      const response = await gqlRequestWithAuth(query, {
        updateActivityInput: {
          ...updateActivityInput,
          typeId: '1e2e860e-befa-4407-83dd-84fa1d2b1e60'
        }
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual('Type not found');
    });
  });

  describe('deleteActivity', () => {
    const deleteActivityInput = {
      id: '1e2e860e-befa-4407-83dd-84fa1d2b1e12'
    };

    const query = `
      mutation ($deleteActivityInput: IDInput!) {
        deleteActivity(deleteActivityInput: $deleteActivityInput)
      }
    `;

    it('should delete activity if it exists', async () => {
      // Act
      const response = await gqlRequestWithAuth(query, { deleteActivityInput });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.deleteActivity).toEqual(
        '1e2e860e-befa-4407-83dd-84fa1d2b1e12'
      );
    });

    it('should not return an error if the activity does not exist', async () => {
      // Act
      const response = await gqlRequestWithAuth(query, {
        deleteActivityInput: { id: '1e2e860e-befa-4407-83dd-84fa1d2b1e11' }
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
    });
  });

  describe('getActivity', () => {
    const getActivityInput = {
      id: '1e2e860e-befa-4407-83dd-84fa1d2b1e12'
    };

    const query = `
      query ($getActivityInput: IDInput!) {
        getActivity(getActivityInput: $getActivityInput) {
          id
          status
        }
      }
    `;

    it('should retrieve activity if it exists', async () => {
      // Act
      const response = await gqlRequestWithAuth(query, { getActivityInput });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.getActivity.status).toBe('Planned');
    });

    it('should return an error if the activity id is invalid', async () => {
      // Act
      const response = await gqlRequestWithAuth(query, {
        getActivityInput: { id: 'invalid' }
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual('id must be a UUID');
    });

    it('should return an error if the activity does not exist', async () => {
      // Act
      const response = await gqlRequestWithAuth(query, {
        getActivityInput: { id: '1e2e860e-befa-4407-83dd-84fa1d2b1e11' }
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual('Activity not found');
    });
  });

  describe('listActivities', () => {
    const query = `
      query {
        listActivities {
          id
        }
      }
    `;

    it('should retrieve a list of activities', async () => {
      // Act
      const response = await gqlRequestWithAuth(query, {});

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.listActivities.length).toBeGreaterThan(0);
    });
  });
});
