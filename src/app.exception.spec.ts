import { GraphQLFormattedError } from 'graphql';
import { ExceptionHandler } from './app.exception';
import { ApolloServerErrorCode } from '@apollo/server/errors';

describe('ExceptionHandler', () => {
  describe('formatApolloError', () => {
    it('should format Apollo error with BAD_REQUEST code correctly', () => {
      // Arrange
      const originalError = {
        code: 'SOME_CODE',
        message: ['Some error message']
      };

      const formattedError: GraphQLFormattedError = {
        message: 'An error occurred',
        extensions: {
          code: ApolloServerErrorCode.BAD_REQUEST,
          originalError
        }
      };

      // Act
      const result = ExceptionHandler.formatApolloError(formattedError);

      // Assert
      expect(result.message).toEqual(originalError.message[0]);
    });

    it('should return error unchanged for other codes', () => {
      // Arrange
      const formattedError: GraphQLFormattedError = {
        message: 'An error occurred',
        extensions: {
          code: 'SOME_OTHER_CODE',
          originalError: {
            code: 'SOME_OTHER_CODE',
            message: ['Some other error message']
          }
        }
      };

      // Act
      const result = ExceptionHandler.formatApolloError(formattedError);

      // Assert
      expect(result).toEqual(formattedError);
    });
  });
});
