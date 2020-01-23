/* eslint-disable lines-between-class-members */
import Joi from '@hapi/joi';

const Transaction = {
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
const userSchema = Joi.object({
  [Transaction.userId]: Joi.string().required(),
  [Transaction.refreshToken]: Joi.string().required(),
  [Transaction.email]: Joi.string().required(),
});

Transaction.validate = async data => {
  const validation = {
    data: null,
    error: null,
  };

  try {
    validation.data = await userSchema.validateAsync(data, {
      presence: 'required',
    });
  } catch (error) {
    validation.error = error.details;
  }

  return validation;
};
export { Transaction };
