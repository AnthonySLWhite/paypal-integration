/* eslint-disable no-shadow */
import jwt from 'jsonwebtoken';

import Knex from 'Init/database';
import { SESSION_SECRET } from 'Constants/configs';
import httpCode from 'http-status-codes';

import { InvalidError, UnexpectedError } from 'Constants/errors';
import { getPaypalToken, getPaypalUserInfo } from '../../Services/paypal_auth';
import { User } from './model';

/** @param {string} paypalAuthCode
    @returns {Promise<
    GenericResponse<object>>}
  */
export async function userAuth(paypalAuthCode) {
  try {
    // debugger;
    const tokens = await getPaypalToken({ initialCode: paypalAuthCode });
    // console.timeLog('Request');
    if (!tokens) return [true, InvalidError.code('PayPal code is invalid!')];

    const info = await getPaypalUserInfo(tokens.access_token);

    const user = {
      [User.userId]: info.userId,
      [User.email]: info.email,
      [User.refreshToken]: tokens.refresh_token,
    };

    const { data, error } = await User.validate(user);

    if (error) return [true, InvalidError.schema(data)];

    try {
      const res = await Knex('users')
        .where({ userId: info.userId })
        .update(user);

      if (res === 0) {
        const res = await Knex('users').insert(user);
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
    const token = jwt.sign(
      { userId: info.userId, paypalToken: tokens.access_token },
      SESSION_SECRET,
      { expiresIn: tokens.expires_in - 100 },
    );

    return [false, { user: info, token }];
  } catch (error) {
    return [true, UnexpectedError.general()];
  }
}
