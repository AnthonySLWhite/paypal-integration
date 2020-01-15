import { ACTION } from 'Constants/actions';
import { store } from 'Store';

const { dispatch } = store;

/**
 * @param {object} payload
 * @param {string} payload.token
 * @param {object} payload.user
 */
export const authentication = payload => dispatch({
  type: ACTION.authentication,
  payload,
});
