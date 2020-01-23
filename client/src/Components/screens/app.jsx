import React, { Component } from 'react';
import { connect } from 'react-redux';
import axios from 'axios';
import { E } from 'Constants';

const INITIAL_STATE = {};
class App extends Component {
  state = INITIAL_STATE;

  componentDidMount = async () => {
    try {
      const res = await axios.get(E.transactions.get());
      debugger;
    } catch (error) {
      debugger;
    }
  };

  render() {
    const { user } = this.props;
    const { email } = user;
    const name = email.split('@')[0];

    return (
      <div className="flex w-full">
        <div className="flex bg-blue-500 w-full justify-center py-5">
          <h1 className="text-white text-3xl">Welcome {name}</h1>
        </div>
      </div>
    );
  }
}
/** @param {import('Store').StoreState} store */
function mapStateToProps(store) {
  const { session } = store;
  const { user } = session;
  return { user };
}
export default connect(mapStateToProps)(App);
