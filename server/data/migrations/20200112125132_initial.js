const Knex = require('knex');

/** @param {Knex} knex */
exports.up = knex =>
  knex.schema
    .createTable('users', table => {
      table.increments('id');
      table
        .string('userId')
        .notNullable()
        .unique();

      table.string('refreshToken').notNullable();
      table.string('email');
    })

    .createTable('transactions', table => {
      table.bigIncrements('id');
      table.string('userId').notNullable();
      table.string('date');
      table.string('time');
      table.string('timeZone');
      table.string('description');
      table.string('currency');
      table.float('gross');
      table.float('fee');
      table.float('net');
      table.float('balance');
      table.string('transactionId').notNullable().unique();
      table.string('fromEmail');
      table.string('name');
      table.string('bankName');
      table.string('bankAccount');
      table.string('shippingAndHandlingAmount');
      table.float('salesTax');
      table.string('invoiceId');
      table.string('referenceId');

      table
        .foreign('userId')
        .references('userId')
        .inTable('users');
    });

/** @param {Knex} knex */
exports.down = knex =>
  knex.schema.dropTableIfExists('transactions').dropTableIfExists('users');
