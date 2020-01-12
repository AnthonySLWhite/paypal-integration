import knex from 'knex';
import { DATABASE_URL } from 'Constants/configs';

export default knex({
  client: 'pg',
  connection: DATABASE_URL,
});
