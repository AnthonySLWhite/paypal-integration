import { REHYDRATE } from 'redux-persist';
import { ACTION } from 'Constants/actions';

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

    case ACTION.resetSession:
      return {
        ...INITIAL_STATE,
      };

    case ACTION.authentication:
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
