/* eslint-disable no-shadow */
import jwt from 'jsonwebtoken';

import Knex from 'Init/database';
import { SESSION_SECRET } from 'Constants/configs';
import { handleError, httpCode } from 'Utils';

import { getPaypalToken, getPaypalUserInfo } from './operations';
import { User } from './model';

export async function userAuth(req, res, next) {
  try {
    const { code } = req.body;
    // debugger;
    const tokens = await getPaypalToken({ initialCode: code });
    // console.timeLog('Request');
    if (!tokens) {
      return next(
        handleError({
          message: 'Invalid code',
          statusCode: httpCode.BAD_REQUEST,
        }),
      );
    }
    const info = await getPaypalUserInfo(tokens.access_token);

    const user = {
      [User.userId]: info.userId,
      [User.email]: info.email,
      [User.refreshToken]: tokens.refresh_token,
    };

    const { data, error } = await User.validate(user);

    if (error) return res.status(httpCode.BAD_REQUEST).send({ error });

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
      }
      // eslint-disable-next-line no-shadow
    } catch (error) {
      // If couldn't create user
      console.error(error);
      handleError({
        statusCode: httpCode.INTERNAL_SERVER_ERROR,
        message: 'Could not create user',
      });
    }
    const token = jwt.sign(
      { userId: info.userId, paypalToken: tokens.access_token },
      SESSION_SECRET,
      { expiresIn: tokens.expires_in - 100 },
    );

    return res.status(200).send({ user: info, token });
  } catch (error) {
    console.log(error);

    return next(
      handleError({
        message: 'Invalid request',
        statusCode: httpCode.BAD_REQUEST,
      }),
    );
  }
}
