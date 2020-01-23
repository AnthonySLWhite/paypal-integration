import jwt from 'jsonwebtoken';
import { SESSION_SECRET } from 'Constants/configs';
import { NotAllowedError } from 'Constants/errors';
import { ErrorHandler } from './error';

/**
 * Adds ***user*** and ***token*** to request object
 */
export async function Secured(req, res, next) {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');

    const data = jwt.verify(token, SESSION_SECRET);

    req.user = data;
    req.token = token;
    next();
  } catch (err) {
    const error = NotAllowedError.badToken(
      'You have supplied an invalid token!',
    );
    return ErrorHandler(error, req, res, next);
  }
}
