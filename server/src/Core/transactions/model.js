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
  [Transaction.date]: Joi.string().allow(null).default(null),
  [Transaction.time]: Joi.string().allow(null).default(null),
  [Transaction.timeZone]: Joi.string().allow(null).default(null),
  [Transaction.description]: Joi.string().allow(null).default(null),
  [Transaction.currency]: Joi.string().allow(null).default(null),
  [Transaction.gross]: Joi.number().allow(null).default(null),
  [Transaction.fee]: Joi.number().allow(null).default(null),
  [Transaction.net]: Joi.number().allow(null).default(null),
  [Transaction.balance]: Joi.number().allow(null).default(null),
  [Transaction.transactionId]: Joi.string().required(),
  [Transaction.fromEmail]: Joi.string().allow(null).default(null),
  [Transaction.name]: Joi.string().allow(null).default(null),
  [Transaction.bankName]: Joi.string().allow(null).default(null),
  [Transaction.bankAccount]: Joi.string().allow(null).default(null),
  [Transaction.shippingAndHandlingAmount]: Joi.string().allow(null).default(null),
  [Transaction.salesTax]: Joi.number().allow(null).default(null),
  [Transaction.invoiceId]: Joi.string().allow(null).default(null),
  [Transaction.referenceId]: Joi.string().allow(null).default(null),
});

Transaction.validate = async data => {
  const validation = {
    data: null,
    error: null,
  };

  try {
    validation.data = await transactionSchema.validateAsync(data, {
      presence: 'required',
    });
  } catch (error) {
    validation.error = error.details;
  }

  return validation;
};
export { Transaction };
