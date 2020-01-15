import { API_ENDPOINT } from 'Constants/configs';

export const E = {
  auth: {
    signIn: () => `${API_ENDPOINT}/users`,
  },
  paypal: {
    getLink: () => `${API_ENDPOINT}/users`,
  },
};
