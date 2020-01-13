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

    const { data, error } = await User.validate({
      userId: 5,
      email: '',
      refresh_token: 'asd',
    });
    console.log({ data, error });
    if (error) return res.status(httpCode.BAD_REQUEST).send({ error });

    // try {
    //   Knex('users')
    //     .insert(user)
    //     .catch(async () => {
    //       try {
    //         console.log(tokens.refresh_token);

    //         const res = await Knex('users').where({ userId }).update(user);
    //         console.log(res);
    //       } catch (error) {
    //         console.log(error);
    //       }
    //     });
    //   // console.log(test);
    // } catch (error) {
    //   console.log(error);
    //   // debugger

    //   // debugger;
    // }
    const token = jwt.sign(
      { userId: info.userId, paypalToken: tokens.access_token },
      SESSION_SECRET,
      { expiresIn: tokens.expires_in - 100 },
    );

    return res.status(200).send({ info, token });
  } catch (error) {
    return next(
      handleError({
        message: 'Invalid request',
        statusCode: httpCode.BAD_REQUEST,
      }),
    );
  }
}
