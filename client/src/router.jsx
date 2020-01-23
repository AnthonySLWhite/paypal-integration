import React from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { persistor, store } from 'Store';

import IndexScreen from 'Components/screens';
import AppScreen from 'Components/screens/app';

import { PaypalReturn } from 'Components/handlers/paypal-return';
import { Routes } from 'Constants';
import AuthenticatedRoute from 'Components/handlers/authenticated-route';

function App() {
  return (
    <PersistGate persistor={persistor}>
      <Provider store={store}>
        <BrowserRouter>
          <Switch>
            <Route exact path={Routes.index} component={IndexScreen} />
            <AuthenticatedRoute exact path={Routes.app} component={AppScreen} />
            <Route path={Routes.paypalCallback} component={PaypalReturn} />
          </Switch>
        </BrowserRouter>
      </Provider>
    </PersistGate>
  );
}

export default App;
