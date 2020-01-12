import React from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import axios from 'axios';
import { parse } from 'query-string';

import IndexScreen from 'Components/screens/Index';

import { API_ENDPOINT } from 'Constants/configs';

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route exact path="/" component={IndexScreen} />
        <Route path="/paypal-return">
          {props => {
            (async () => {
              const { search } = props.location;
              const { code } = parse(search);
              try {
                const res = await axios.post(`${API_ENDPOINT}/user`, {
                  code,
                });
                console.log('success', res);
                // debugger;
              } catch (error) {
                console.log('error', error);

                // debugger;
              }
            })();
            return null;
          }}
        </Route>
      </Switch>
    </BrowserRouter>
  );
}

export default App;
