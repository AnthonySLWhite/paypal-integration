import queryString from 'querystring';
import axios from 'axios';
import { PAYPAL_ID, PAYPAL_SECRET, PAYPAL_API_URL } from 'Constants/configs';

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
      `${PAYPAL_API_URL}/v1/oauth2/token`,
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
    return null;
  }
}

/**
 * @typedef {object} getPaypalUserInfoReturnData
 * @property {string} user_id
 * @property {string} email
 */
/**
 * @param {string} activeToken
 * @returns {Promise<getPaypalUserInfoReturnData|null>}
 */
export async function getPaypalUserInfo(activeToken) {
  try {
    const res = await axios.get(
      `${PAYPAL_API_URL}/v1/identity/oauth2/userinfo?schema=paypalv1.1`,
      {
        headers: {
          Authorization: `Bearer ${activeToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
    const { data } = res;
    const { user_id, emails = [] } = data;

    const { value: primaryEmail } = emails.find(
      ({ primary }) => primary === true,
    );

    return { email: primaryEmail, user_id };
  } catch ({ response }) {
    const { data } = response;
    console.log(data);
    return null;
  }
}
