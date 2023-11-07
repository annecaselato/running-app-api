import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Repository } from 'typeorm';
import { useContainer } from 'class-validator';
import { ActivityType } from '../src/modules/types/activity-type.entity';
import { CreateTypeInput } from '../src/modules/types/dto';
import { Activity } from '../src/modules/activity/activity.entity';
import { User } from '../src/modules/users/user.entity';
import { ActivityModule } from '../src/modules/activity/activity.module';
import { UserModule } from '../src/modules/users/user.module';
import { TestUtils } from './test-utils';

describe('TypeResolver E2E', () => {
  let app: INestApplication;
  let typeRepository: Repository<ActivityType>;
  let userRepository: Repository<User>;
  let activityRepository: Repository<Activity>;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'jwt-secret';
    const module = await new TestUtils().getModule(
      [ActivityModule, UserModule],
      []
    );

    app = module.createNestApplication();

    activityRepository = module.get('ActivityRepository');
    typeRepository = module.get('ActivityTypeRepository');
    userRepository = module.get('UserRepository');

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true })
    );

    await app.init();
    useContainer(app.select(ActivityModule), { fallbackOnErrors: true });
  });

  beforeEach(async () => {
    // Arrange
    await userRepository.query(
      'INSERT INTO "user"("id", "name", "email") VALUES ("user-id", "User", "user@email.com")'
    );

    await typeRepository.query(
      'INSERT INTO "activity_type"("id", "type", "description", "userId") VALUES ("1e2e860e-befa-4407-83dd-84fa1d2b1e62", "New Run", null, "user-id")'
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

  describe('createType', () => {
    const createTypeInput: CreateTypeInput = {
      type: 'Run',
      description: 'Easy pace run.'
    };

    const query = `
      mutation ($createTypeInput: CreateTypeInput!) {
        createType(createTypeInput: $createTypeInput) {
          id
        }
      }
    `;

    it('should create type if all parameters are valid', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(app, query, {
        createTypeInput
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      expect(response.body.data.createType.id).toBeTruthy();
    });

    it('should return an error if the type already exist', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(app, query, {
        createTypeInput: {
          type: 'New Run',
          description: 'Easy pace run.'
        }
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual('Type already exist');
    });

    it('should return an error if type is invalid', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(app, query, {
        createTypeInput: {
          ...createTypeInput,
          type: ''
        }
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual(
        'type should not be empty'
      );
    });
  });

  describe('updateType', () => {
    const updateTypeInput = {
      id: '1e2e860e-befa-4407-83dd-84fa1d2b1e62',
      type: 'UpdatedType',
      description: 'Updated description'
    };

    const query = `
      mutation ($updateTypeInput: UpdateTypeInput!) {
        updateType(updateTypeInput: $updateTypeInput) {
          id
          type
          description
        }
      }
    `;

    it('should update a type if all parameters are valid', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(app, query, {
        updateTypeInput
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      const updatedType = response.body.data.updateType;
      expect(updatedType.id).toBeTruthy();
      expect(updatedType.type).toEqual('UpdatedType');
      expect(updatedType.description).toEqual('Updated description');
    });

    it('should return an error if the type does not exist', async () => {
      const nonExistentId = '1e2e860e-befa-4407-83dd-84fa1d2b1e63';

      // Act
      const response = await new TestUtils().gqlRequest(app, query, {
        updateTypeInput: { ...updateTypeInput, id: nonExistentId }
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual('Type not found');
    });
  });

  describe('deleteType', () => {
    const deleteTypeInput = {
      id: '1e2e860e-befa-4407-83dd-84fa1d2b1e62'
    };

    const query = `
      mutation ($deleteTypeInput: IDInput!) {
        deleteType(deleteTypeInput: $deleteTypeInput)
      }
    `;

    it('should delete a type if it exists', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(app, query, {
        deleteTypeInput
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      const deletedTypeId = response.body.data.deleteType;
      expect(deletedTypeId).toEqual('1e2e860e-befa-4407-83dd-84fa1d2b1e62');
    });

    it('should not return an error if the type does not exist', async () => {
      const nonExistentId = '1e2e860e-befa-4407-83dd-84fa1d2b1e63';

      // Act
      const response = await new TestUtils().gqlRequest(app, query, {
        deleteTypeInput: { id: nonExistentId }
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
    });

    it('should return an error if the type is being used', async () => {
      // Arrange

      // Act
      const response = await new TestUtils().gqlRequest(app, query, {
        deleteTypeInput: { id: '1e2e860e-befa-4407-83dd-84fa1d2b1e65' }
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual(
        'Type is being used by activities'
      );
    });
  });

  describe('getType', () => {
    const getTypeInput = {
      id: '1e2e860e-befa-4407-83dd-84fa1d2b1e62'
    };

    const query = `
      query ($getTypeInput: IDInput!) {
        getType(getTypeInput: $getTypeInput) {
          id
          type
          description
        }
      }
    `;

    it('should return the type if it exists', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(app, query, {
        getTypeInput
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      const type = response.body.data.getType;
      expect(type).toBeTruthy();
    });

    it('should return error if the type is not found', async () => {
      const nonExistentId = '1e2e860e-befa-4407-83dd-84fa1d2b1e63';

      // Act
      const response = await new TestUtils().gqlRequest(app, query, {
        getTypeInput: { id: nonExistentId }
      });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors[0].message).toEqual('Type not found');
    });
  });

  describe('listTypes', () => {
    const query = `
      query {
        listTypes {
          id
          type
          description
        }
      }
    `;

    it('should return a list of types', async () => {
      // Act
      const response = await new TestUtils().gqlRequest(app, query, {});

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.errors).toBeFalsy();
      const types = response.body.data.listTypes;
      expect(types).toBeTruthy();
    });
  });
});
