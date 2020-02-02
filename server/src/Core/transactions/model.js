/* eslint-disable lines-between-class-members */
import Joi from '@hapi/joi';

const Transaction = {
  table: 'transactions',

  userId: 'userId',

  date: 'date',
  time: 'time',
  timeZone: 'timeZone',
  description: 'description',
  currency: 'currency',
  gross: 'gross',
  fee: 'fee',
  net: 'net',
  balance: 'balance',
  transactionId: 'transactionId',
  fromEmail: 'fromEmail',
  name: 'name',
  bankName: 'bankName',
  bankAccount: 'bankAccount',
  shippingAndHandlingAmount: 'shippingAndHandlingAmount',
  salesTax: 'salesTax',
  invoiceId: 'invoiceId',
  referenceId: 'referenceId',

  /** @returns Promise<{{error: object, data: object }}> */
  validate: async data => ({ error: {}, data: {} }),
};
const transactionSchema = Joi.object({
  [Transaction.userId]: Joi.string().required(),
  [Transaction.date]: Joi.string().default(null),
  [Transaction.time]: Joi.string().default(null),
  [Transaction.timeZone]: Joi.string().default(null),
  [Transaction.description]: Joi.string().default(null),
  [Transaction.currency]: Joi.string().default(null),
  [Transaction.gross]: Joi.number().default(null),
  [Transaction.fee]: Joi.number().default(null),
  [Transaction.net]: Joi.number().default(null),
  [Transaction.balance]: Joi.number().default(null),
  [Transaction.transactionId]: Joi.string().required(),
  [Transaction.fromEmail]: Joi.string().default(null),
  [Transaction.name]: Joi.string().default(null),
  [Transaction.bankName]: Joi.string().default(null),
  [Transaction.bankAccount]: Joi.string().default(null),
  [Transaction.shippingAndHandlingAmount]: Joi.string().default(null),
  [Transaction.salesTax]: Joi.number().default(null),
  [Transaction.invoiceId]: Joi.string().default(null),
  [Transaction.referenceId]: Joi.string().default(null),
});

Transaction.validate = async data => {
  const validation = {
    data: null,
    error: null,
  };

  try {
    validation.data = await transactionSchema.validateAsync(data, {
      // presence: 'required',
    });
  } catch (error) {
    validation.error = error.details;
  }

  return validation;
};
export { Transaction };
