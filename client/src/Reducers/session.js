import { REHYDRATE } from 'redux-persist';
import { AUTHENTICATION, RESET_SESSION } from 'Constants/actions';

/**
 * @typedef SessionSchema
 * @property {boolean} isAuthenticated
 * @property {?object} user
 * @property {?string} token
 */

/** @type {SessionSchema} */
const INITIAL_STATE = {
  isAuthenticated: false,
  user: null,
  token: null,
};

/** @returns {SessionSchema} */
export function session(state = INITIAL_STATE, { type, payload }) {
  switch (type) {
    case REHYDRATE:
      if (payload && payload.session) {
        return {
          ...payload.session,
        };
      }
      return state;

    case RESET_SESSION:
      return {
        ...INITIAL_STATE,
      };

    case AUTHENTICATION:
      return {
        ...state,
        isAuthenticated: true,
        user: payload.user,
        token: payload.token,
      };

    default:
      return state;
  }
}
