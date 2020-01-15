import dotenv from 'dotenv';

dotenv.config();

const {
  PORT = 8080,
  PAYPAL_ID,
  PAYPAL_SECRET,
  DATABASE_URL,
  SESSION_SECRET = 'fmjsdfbhjeg784t36745gr23',
} = process.env;

export { PORT, PAYPAL_ID, PAYPAL_SECRET, DATABASE_URL, SESSION_SECRET };
export const PAYPAL_API_URL = 'https://api.sandbox.paypal.com';

export * from './constants';
