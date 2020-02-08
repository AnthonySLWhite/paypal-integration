import React, { Component } from 'react';
import { connect } from 'react-redux';
import axios from 'axios';
import { E } from 'Constants';
import { logout } from 'Operations/auth';
import csv from 'csv';

const INITIAL_STATE = {
  transactions: [],
};
class App extends Component {
  state = INITIAL_STATE;

  constructor(props) {
    super(props);
    this.prepare();
  }

  prepare = async () => {
    try {
      const res = await axios.get(E.transactions.get());
      const { data } = res;

      this.setState({ transactions: data || [] });
    } catch (error) {
      // debugger;
    }
  };

  sendTransactions = async transactions => {
    if (!transactions || !transactions.length) return;
    const { token } = this.props;
    try {
      const res = await axios.post(E.transactions.post(), transactions, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      this.prepare();
      console.log(res);
    } catch (error) {
      console.log(error);
    }
  };

  handleFileChange = e => {
    const { files } = e.target;
    if (!files.length) return;
    const [file] = files;
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = this.handleCsvFile;
  };

  handleCsvFile = file => {
    const { result } = file.target;
    console.log(result);

    csv.parse(result, {}, (err, records = [], info) => {
      if (err) return;
      records.shift();
      const parsedRecords = records.map(transaction => {
        const [
          date,
          time,
          timeZone,
          description,
          currency,
          gross,
          fee,
          net,
          balance,
          transactionId,
          fromEmail,
          name,
          bankName,
          bankAccount,
          shippingAndHandlingAmount,
          salesTax,
          invoiceId,
          referenceId,
        ] = transaction;
        return {
          transactionId: transactionId || null,
          date: date || null,
          time: time || null,
          timeZone: timeZone || null,
          referenceId: referenceId || null,
          currency: currency || null,
          gross: gross ? gross.replace(/\./, '').replace(',', '.') : null,
          balance: balance ? balance.replace(/\./, '').replace(',', '.') : null,
          bankAccount: bankAccount || null,
          bankName: bankName || null,
          description: description || null,
          fee: fee ? fee.replace(/\./, '').replace(',', '.') : null,
          fromEmail: fromEmail || null,
          invoiceId: invoiceId || null,
          name: name || null,
          net: net ? net.replace(/\./, '').replace(',', '.') : null,
          salesTax: salesTax
            ? salesTax.replace(/\./, '').replace(',', '.')
            : null,
          shippingAndHandlingAmount: shippingAndHandlingAmount || null,
        };
      });
      this.sendTransactions(parsedRecords);
    });

    // debugger;
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
            name,
            description,
            currency,
            gross,
            transactionId,
            fromEmail,
            referenceId,
            balance,
          } = transaction;

          return (
            <div
              key={transactionId}
              className="flex justify-between items-center p-5 shadow"
            >
              <div className="flex flex-col">
                <span>ID: {transactionId}</span>
                <span>
                  {date} - {time}
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-2xl">
                  {gross} {currency}
                </span>
                <span className="text-sm">
                  {balance} {currency}
                </span>
                <span>{name}</span>
              </div>
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
          <label className="absolute top-0 left-0 py-2 bg-white m-5">
            <input type="file" onChange={this.handleFileChange} accept=".csv" />
          </label>
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
  const { user, token } = session;
  return { user, token };
}
export default connect(mapStateToProps)(App);
