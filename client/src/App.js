import React from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { persistor, store } from 'Store';

import IndexScreen from 'Components/screens/Index';

import { PaypalReturn } from 'Components/handlers/paypal-return';

function App() {
  return (
    <PersistGate persistor={persistor}>
      <Provider store={store}>
        <BrowserRouter>
          <Switch>
            <Route exact path="/" component={IndexScreen} />
            <Route path="/paypal-return" component={PaypalReturn} />
          </Switch>
        </BrowserRouter>
      </Provider>
    </PersistGate>
  );
}

export default App;
