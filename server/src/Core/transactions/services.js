/* eslint-disable no-return-assign */
/* eslint-disable consistent-return */
import { DB } from 'Init/database';
import dateFns from 'date-fns';

import { InvalidError, UnexpectedError } from 'Constants/errors';
import { Transaction } from './model';

/**
 * @param {string} userId
 * @param {Transaction[]} transactions
 *
 * @returns {Promise<
    GenericResponse<null|object>>}
  */
export async function addTransaction(userId, transactions) {
  try {
    const transactionsToValidate = transactions.map(transactionData => {
      const {
        transactionId,
        isoDate,
        referenceId,
        currency,
        gross,
        balance,
        bankAccount,
        bankName,
        description,
        fee,
        fromEmail,
        invoiceId,
        name,
        net,
        salesTax,
        shippingAndHandlingAmount,
      } = transactionData;

      const parsedDate = dateFns.parseISO(isoDate);
      const date = dateFns.format(parsedDate, 'dd.MM.yyyy');
      const time = dateFns.format(parsedDate, 'k:mm:ss');
      const timeZone = dateFns.format(parsedDate, 'OOOO');

      return {
        [Transaction.userId]: userId,
        [Transaction.transactionId]: transactionId,
        [Transaction.referenceId]: referenceId,
        [Transaction.date]: date,
        [Transaction.time]: time,
        [Transaction.timeZone]: timeZone,
        [Transaction.currency]: currency,
        [Transaction.gross]: gross && Number(gross),
        [Transaction.balance]: balance && Number(balance),

        [Transaction.bankAccount]: bankAccount,
        [Transaction.bankName]: bankName,

        [Transaction.description]: description,
        [Transaction.fee]: fee && Number(fee),
        [Transaction.fromEmail]: fromEmail,
        [Transaction.invoiceId]: invoiceId,
        [Transaction.name]: name,
        [Transaction.net]: net && Number(net),
        [Transaction.salesTax]: salesTax && Number(salesTax),
        [Transaction.shippingAndHandlingAmount]: shippingAndHandlingAmount,
      };
    });

    const pendingValidations = transactionsToValidate.map(trans =>
      Transaction.validate(trans));

    let validationError = null;
    const parsedTransactions = [];

    const validatedTransactions = await Promise.all(pendingValidations);
    validatedTransactions.forEach(({ data, error }) => {
      if (validationError) return;
      if (error) return (validationError = error);
      parsedTransactions.push(data);
    });

    if (validationError) return [true, InvalidError.schema(validationError)];

    try {
      const res = await DB(Transaction.table).insert(parsedTransactions);
      return [false, null];
    } catch (error) {
      return [true, UnexpectedError.creating('Could not insert transactions!', error)];
    }
  } catch (error) {
    return [true, UnexpectedError.general(null, error)];
  }
}
