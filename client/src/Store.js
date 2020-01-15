import { createStore, compose, applyMiddleware } from 'redux';
import ReduxThunk from 'redux-thunk';
import { persistStore, persistCombineReducers } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { session } from 'Reducers/session';

const isDevVersion = process.env.NODE_ENV === 'development';
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const middlewares = [ReduxThunk];

const volatileReducers = [];

const config = {
  key: 'root',
  storage,
  debug: isDevVersion,
  blacklist: volatileReducers,
  // migrate: async oState => {
  //   const { version } = oState.general;
  //   if (version === VERSION) return oState;
  //   return {};
  // },
};

const reducers = persistCombineReducers(config, {
  session,
});

/**
 * @typedef StoreState
 * @property {session} session
 */

export const store = createStore(
  reducers,
  composeEnhancers(applyMiddleware(...middlewares)),
);

export const persistor = persistStore(store);
