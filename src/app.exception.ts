import { ApolloServerErrorCode } from '@apollo/server/errors';
import { GraphQLFormattedError } from 'graphql';

interface OriginalError {
  code: string;
  message: string[];
}

export class ExceptionHandler {
  public static formatApolloError(error: GraphQLFormattedError) {
    const { code, originalError } = error.extensions;

    if (code === ApolloServerErrorCode.BAD_REQUEST) {
      return {
        ...error,
        message: (originalError as OriginalError).message[0]
      };
    }

    return error;
  }
}
