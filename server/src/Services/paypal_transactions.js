import Axios from 'axios';
import queryString from 'querystring';

import { E } from 'Constants/endpoints';
import { DB } from 'Init/database';
import { User } from 'Core/user/model';
import { getPaypalToken } from './paypal_auth';

export async function getPaypalTransactions(token, startDate, EndDate) {
  const getQueryParams = page => {
    const params = {
      fields: 'transaction_info',
      page_size: 500,
      page: page || 1,
      start_date: startDate,
      end_date: EndDate,

      transaction_id: null,
      transaction_type: null,
      transaction_status: null,
      transaction_amount: null,
      transaction_currency: null,
      payment_instrument_type: null,
      store_id: null,
      terminal_id: null,
      balance_affecting_records_only: null,
    };

    const parsedQueryParams = {};
    Object.keys(params)
      .filter(k => !!params[k])
      .forEach(k => {
        parsedQueryParams[k] = params[k];
      });

    return queryString.stringify(parsedQueryParams);
  };

  try {
    const res = await Axios.get(E.paypal.transactions.get(getQueryParams()), {
      headers: {
        Authorization: `Bearer  ${token}`,
      },
    });
    console.log(res);
    const { data: Transactions } = res;
    const { total_pages } = Transactions;

    if (!total_pages) return Transactions;

    const pages = Array(total_pages - 1);

    const pagesRequest = pages.map((page, i) =>
      Axios.get(E.paypal.transactions.get(getQueryParams(i + 2)), {
        headers: {
          Authorization: `Bearer  ${token}`,
        },
      }),
    );

    const resolvedPages = await Promise.all(pagesRequest);

    resolvedPages.forEach(({ data, status }) => {
      if (!data && status === 200) return;
      const { transaction_details } = data;
      if (transaction_details && transaction_details.length) {
        Transactions.transaction_details.concat(transaction_details);
      }
    });

    return Transactions;
  } catch (error) {
    console.log(error.response.data);
  }
}

export async function getUsersPaypalTransactions(startDate, EndDate) {
  const users = await DB(User.table)
    .select(User.userId)
    .select(User.refreshToken);

  users.forEach(user => {
    const { [User.userId]: userId, [User.refreshToken]: refreshToken } = user;
    console.log(`Getting user: ${userId}`);

    getPaypalToken({ refreshToken }).then(async res => {
      if (!res) return;
      const { access_token } = res;
      const transactions = await getPaypalTransactions(
        access_token,
        startDate,
        EndDate,
      );
      console.log(transactions);
    });
  });
}
