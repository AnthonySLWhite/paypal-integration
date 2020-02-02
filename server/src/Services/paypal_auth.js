import queryString from 'querystring';
import axios from 'axios';
import { PAYPAL_ID, PAYPAL_SECRET } from 'Constants/configs';
import { E } from 'Constants/endpoints';

/**
 * @typedef {object} getPaypalTokenReturnData
 * @property {string} access_token
 * @property {string} [refresh_token]
 * @property {number} expires_in
 */
/**
 * @param {object} codes
 * @param {string} [codes.initialCode]
 * @param {string} [codes.refreshToken]
 * @returns {Promise<getPaypalTokenReturnData|null>}
 */
export async function getPaypalToken(codes) {
  const auth = Buffer.from(`${PAYPAL_ID}:${PAYPAL_SECRET}`).toString('base64');
  const isRefreshToken = codes.refreshToken && !codes.initialCode;
  const payload = {};
  if (isRefreshToken) {
    payload.grant_type = 'refresh_token';
    payload.refresh_token = codes.refreshToken;
  } else {
    payload.grant_type = 'authorization_code';
    payload.code = codes.initialCode;
  }

  try {
    const { data } = await axios.post(
      E.paypal.auth.getTokens(),
      // @ts-ignore
      queryString.stringify(payload),
      {
        headers: {
          ...axios.defaults.headers,
          Authorization: `Basic ${auth}`,
          'Content-type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const { access_token, refresh_token, expires_in } = data;

    const dataToReturn = { access_token, expires_in };

    if (refresh_token) dataToReturn.refresh_token = refresh_token;

    return dataToReturn;
  } catch (err) {
    console.error(err);
    console.error(err.response);

    return null;
  }
}

/**
 * @typedef {object} getPaypalUserInfoReturnData
 * @property {string} userId
 * @property {string} email
 */
/**
 * @param {string} activeToken
 * @returns {Promise<getPaypalUserInfoReturnData|null>}
 */
export async function getPaypalUserInfo(activeToken) {
  try {
    const res = await axios.get(E.paypal.auth.getUserInfo(), {
      headers: {
        Authorization: `Bearer ${activeToken}`,
        'Content-Type': 'application/json',
      },
    });
    const { data } = res;
    const { user_id, emails = [] } = data;
    let email = null;

    if (emails.length) {
      const { value: primaryEmail } = emails.find(
        ({ primary }) => primary === true,
      );
      email = primaryEmail;
    }

    return { email, userId: user_id };
  } catch ({ response }) {
    const { data } = response;
    console.log(data);
    return null;
  }
}
