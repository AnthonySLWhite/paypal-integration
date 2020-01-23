import jwt from 'jsonwebtoken';
import { SESSION_SECRET } from 'Constants/configs';
import { NotAllowedError } from 'Constants/errors';
import { validateJwtToken } from 'Services/tokens';
import { ErrorHandler } from './error';

/**
 * Adds ***user*** and ***token*** to request object
 */
export async function Secured(req, res, next) {
  const token = req.header('Authorization').replace('Bearer ', '');
  const data = validateJwtToken(token);
  if (data) {
    req.user = data;
    req.token = token;
    return next();
  }
  const error = NotAllowedError.badToken(
    'You have supplied an invalid token!',
  );
  return ErrorHandler(error, req, res, next);
}
