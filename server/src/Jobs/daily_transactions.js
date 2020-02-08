import cron from 'node-cron';
import dateFns from 'date-fns';
import { getUsersPaypalTransactions } from 'Services/paypal_transactions';

// Testing Only
// getUsersPaypalTransactions('2019-12-30T00:00:00Z', '2019-12-31T00:00:00Z');

/** Get Daily Transactions */
cron.schedule('0 0 0 * * *', () => {
// cron.schedule('*/30 * * * * *', () => {
  console.log('Getting daily Transactions!');

  const startOfToday = dateFns.startOfToday();
  const startOfYesterday = dateFns.startOfYesterday();

  const todaysMidnightTime = dateFns.formatISO(startOfToday);
  const yesterdayMidnightTime = dateFns.formatISO(startOfYesterday);
  getUsersPaypalTransactions(yesterdayMidnightTime, todaysMidnightTime);
});
