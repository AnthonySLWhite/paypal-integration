import HttpCodes from 'http-status-codes';
import { ApiErrorGenerator } from 'Utils/errors';

const Invalid = ApiErrorGenerator();
const NotAllowed = ApiErrorGenerator();
const Unexpected = ApiErrorGenerator();

export const InvalidError = {
  code: Invalid(HttpCodes.BAD_REQUEST, 'invalid_code'),
  schema: Invalid(HttpCodes.BAD_REQUEST, 'invalid_schema'),
};

export const NotAllowedError = {
  badToken: Invalid(HttpCodes.UNAUTHORIZED, 'invalid_token'),
};

export const UnexpectedError = {
  general: Unexpected(HttpCodes.INTERNAL_SERVER_ERROR, 'general'),
  creating: Unexpected(HttpCodes.INTERNAL_SERVER_ERROR, 'failed_to_create'),
};
