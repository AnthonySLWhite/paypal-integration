// @ts-nocheck
/* eslint-disable prefer-const */
/* eslint-disable import/no-mutable-exports */
import dotenv from 'dotenv';

dotenv.config();

let {
  PORT = 8080,
  PAYPAL_ID,
  PAYPAL_SECRET,
  PAYPAL_PROD,
  DATABASE_URL,
  SESSION_SECRET = 'fmjsdfbhjeg784t36745gr23',
  REDIRECT_URI,
} = process.env;

PAYPAL_PROD = PAYPAL_PROD === 'true';

export {
  PORT,
  PAYPAL_ID,
  PAYPAL_SECRET,
  PAYPAL_PROD,
  DATABASE_URL,
  SESSION_SECRET,
  REDIRECT_URI,
};
export const PAYPAL_API_URL = PAYPAL_PROD
  ? 'https://api.paypal.com'
  : 'https://api.sandbox.paypal.com';

export * from './constants';
