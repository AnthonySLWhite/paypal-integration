import jwt from 'jsonwebtoken';
import { SESSION_SECRET } from 'Constants/configs';

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
    res.status(401).send({
      message: 'Invalid token provided!',
    });
  }
}
