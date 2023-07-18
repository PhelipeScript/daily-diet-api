// eslint-disable-next-line
import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    meals: {
      id: string
      session_id?: string
      name: string
      description: string
      meal_time: string
      created_at: string
      is_in_diet: boolean
    }

    users: {
      id: string
      session_id: string
      name: string
      email: string
      password: string
      avatar_url?: string
    }
  }
}
