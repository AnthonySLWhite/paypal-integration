import { API_ENDPOINT } from 'Constants/configs';

export const E = {
  auth: {
    signIn: () => `${API_ENDPOINT}/users`,
  },
  transactions: {
    get: () => `${API_ENDPOINT}/transactions`,
    post: () => `${API_ENDPOINT}/transactions`,
  },
  paypal: {
    getLink: () => `${API_ENDPOINT}/users`,
  },
};
