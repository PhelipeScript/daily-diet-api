import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().notNullable()
    table.uuid('session_id').notNullable()
    table.text('name').notNullable()
    table.text('email').notNullable()
    table.text('password').notNullable()
    table.text('avatar_url')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('users')
}
