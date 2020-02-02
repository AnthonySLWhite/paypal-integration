import React, { Component } from 'react';
import { connect } from 'react-redux';
import axios from 'axios';
import { E } from 'Constants';
import { logout } from 'Operations/auth';

const INITIAL_STATE = {
  transactions: [],
};
class App extends Component {
  state = INITIAL_STATE;

  componentDidMount = async () => {
    try {
      const res = await axios.get(E.transactions.get());
      const { data } = res;

      this.setState({ transactions: data });
    } catch (error) {
      debugger;
    }
  };

  renderTransactions = () => {
    const { transactions } = this.state;

    return (
      <div className="w-full flex flex-col m-10 max-w-2xl mx-auto flex-grow">
        {transactions.map(transaction => {
          const {
            id,
            userId,
            date,
            time,
            timeZone,
            description,
            currency,
            gross,
            transactionId,
            fromEmail,
            referenceId,
          } = transaction;

          return (
            <div className="flex justify-between items-center p-5 shadow">
              <div className="flex flex-col">
                <span>ID: {transactionId}</span>
                <span>
                  {date} - {time}
                </span>
              </div>
              <span className="text-2xl">
                {gross} {currency}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  render() {
    const { user } = this.props;
    const { email } = user || {};
    const name = email ? email.split('@')[0] : 'user';

    return (
      <div className="w-full flex flex-col">
        <div className="flex bg-blue-500 w-full justify-center py-5">
          <h1 className="text-white text-3xl">Welcome {name}</h1>
          <button
            className="absolute top-0 right-0 m-5 bg-white px-5 py-2"
            type="button"
            onClick={logout}
          >
            Logout
          </button>
        </div>
        {this.renderTransactions()}
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
