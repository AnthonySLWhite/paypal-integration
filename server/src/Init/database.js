import knex from 'knex';
import { DATABASE_URL } from 'Constants/configs';

export const DB = knex({
  client: 'pg',
  connection: DATABASE_URL,
});
