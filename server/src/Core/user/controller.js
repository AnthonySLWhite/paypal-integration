import sharp from 'sharp';
import uuid from 'uuid/v4';
import axios from 'axios';
import queryString from 'querystring';
import { PAYPAL_ID, PAYPAL_SECRET } from 'Constants/configs';

import { PATH_PUBLIC_AVATARS } from '../../Constants/configs';
import { deleteFile, readFile } from '../../utils';
import { User } from './model';

export async function getToken(code) {
  const paypalCredentials = `${PAYPAL_ID}:${PAYPAL_SECRET}`;
  const auth = Buffer.from(paypalCredentials).toString('base64');
  try {
    const { data } = await axios.post(
      'https://api.sandbox.paypal.com/v1/oauth2/token',
      queryString.stringify({
        grant_type: 'authorization_code',
        code,
      }),
      {
        headers: {
        //   ...axios.defaults.headers,
          Authorization: `Basic ${auth}`,
          'Content-type': 'application/x-www-form-urlencoded',
        },
      },
    );
    const { access_token } = data;
    return access_token;
  } catch (err) {
    return null;
  }
}
