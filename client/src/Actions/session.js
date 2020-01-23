import { AUTHENTICATION, RESET_SESSION } from 'Constants/actions';
import { store } from 'Store';

const { dispatch } = store;

/**
 * @param {object} payload
 * @param {string} payload.token
 * @param {object} payload.user
 */
export const authentication = payload => dispatch({
  type: AUTHENTICATION,
  payload,
});

export const resetSession = () => dispatch({
  type: RESET_SESSION,
});
