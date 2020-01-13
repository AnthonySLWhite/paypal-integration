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
              const { history } = props;
              const { search } = props.location;
              const { code } = parse(search);
              try {
                const res = await axios.post(`${API_ENDPOINT}/users`, {
                  code,
                });
                console.log('success', res);
              } catch (error) {
                const { data, status } = error.response;
                const { message } = data;
                {/* if (status === 400) history.push('/'); */}
                console.log(message);
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
