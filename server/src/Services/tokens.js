import jwt from 'jsonwebtoken';
import { SESSION_SECRET } from 'Constants/configs';

/** @typedef {object} TokenPayload
 * @property {string} userId
 * @property {string} _t
 */

export function generateJwtToken({ userId, paypalToken }, expires_in = 7000) {
  /** @type {TokenPayload} */
  const payload = {
    _t: Buffer.from(paypalToken).toString('base64'),
    userId,
  };

  return jwt.sign(payload, SESSION_SECRET, {
    expiresIn: expires_in - 100,
  });
}

/** @returns {{userId: string, paypalToken: string} | null} */
export function validateJwtToken(token) {
  try {
    /** @type {TokenPayload} */
    // @ts-ignore
    const { _t, userId } = jwt.verify(token, SESSION_SECRET);
    const paypalToken = Buffer.from(_t, 'base64').toString('utf-8');
    return {
      paypalToken,
      userId,
    };
  } catch (error) {
    return null;
  }
}
