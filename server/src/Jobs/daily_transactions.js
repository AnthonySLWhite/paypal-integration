import cron from 'node-cron';
import dateFns from 'date-fns';
import { getUsersPaypalTransactions } from 'Services/paypal_transactions';

/** Get Daily Transactions */
// cron.schedule('0 0 0 * * *', () => {
const startOfToday = dateFns.startOfToday();
const startOfYesterday = dateFns.startOfYesterday();

const todaysMidnightTime = dateFns.formatISO(startOfToday);
const yesterdayMidnightTime = dateFns.formatISO(startOfYesterday);
getUsersPaypalTransactions(yesterdayMidnightTime, todaysMidnightTime);
// cron.schedule('*/30 * * * * *', () => {
//   // getPaypalTransactions(yesterdayMidnightTime, todaysMidnightTime);
// });
