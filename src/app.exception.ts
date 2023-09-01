import { ApolloServerErrorCode } from '@apollo/server/errors';
import { GraphQLFormattedError } from 'graphql';

interface OriginalError {
  code: string;
  message: string[];
}

export class ExceptionHandler {
  public static formatApolloError(error: GraphQLFormattedError) {
    const { code, originalError } = error.extensions;
    const originalMessage = (originalError as OriginalError).message;

    if (code === ApolloServerErrorCode.BAD_REQUEST) {
      return {
        ...error,
        message:
          typeof originalMessage === 'string'
            ? originalMessage
            : originalMessage[0]
      };
    }

    return error;
  }
}
