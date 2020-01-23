import { PAYPAL_API_URL } from './configs';

export const E = {
  paypal: {
    auth: {
      getTokens: () => `${PAYPAL_API_URL}/v1/oauth2/token`,
      getUserInfo: () =>
        `${PAYPAL_API_URL}/v1/identity/oauth2/userinfo?schema=paypalv1.1`,
    },
  },
};
