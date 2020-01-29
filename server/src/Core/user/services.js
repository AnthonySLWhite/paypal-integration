/* eslint-disable no-shadow */
import { DB } from 'Init/database';

import { InvalidError, UnexpectedError } from 'Constants/errors';
import { generateJwtToken } from 'Services/tokens';
import { getPaypalToken, getPaypalUserInfo } from 'Services/paypal_auth';
import { User } from './model';

/** @param {string} paypalAuthCode
    @returns {Promise<
    GenericResponse<object>>}
  */
export async function userAuth(paypalAuthCode) {
  try {
    const tokens = await getPaypalToken({ initialCode: paypalAuthCode });
    if (!tokens) return [true, InvalidError.code('PayPal code is invalid!')];

    const userInfo = await getPaypalUserInfo(tokens.access_token);

    const user = {
      [User.userId]: userInfo.userId,
      [User.email]: userInfo.email,
      [User.refreshToken]: tokens.refresh_token,
    };

    const { data, error } = await User.validate(user);

    if (error) return [true, InvalidError.schema(error)];

    try {
      const res = await DB(User.table)
        .where({ userId: userInfo.userId })
        .update(user);

      if (res === 0) {
        const res = await DB(User.table).insert(user);
        // @ts-ignore
        if (!res?.rowCount) {
          throw Error;
        }
        // On Create
      } else {
        // On Update
      }
      // eslint-disable-next-line no-shadow
    } catch (error) {
      // If couldn't create user
      return [true, UnexpectedError.creating('Could not create user', error)];
    }

    const token = generateJwtToken(
      { userId: userInfo.userId, paypalToken: tokens.access_token },
      tokens.expires_in,
    );
    return [false, { user: userInfo, token }];
  } catch (error) {
    return [true, UnexpectedError.general(null, error)];
  }
}
