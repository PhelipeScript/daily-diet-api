import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'

import { app } from '../src/app'

describe('Meals routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new user', async () => {
    await request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'johnDoe@example.com',
        password: 'password2023',
      })
      .expect(201)
  })

  it('should be able to login', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'johnDoe@example.com',
        password: 'password2023',
      })
      .expect(201)

    const sessionId = createUserResponse.get('Set-Cookie')

    // next line will replace session_id on cookies
    await request(app.server)
      .post('/users')
      .send({
        name: 'John Doe 2',
        email: 'johnDoe2@example.com',
        password: 'password2003',
      })
      .expect(201)

    const loginAccountResponse = await request(app.server)
      .post('/users/login')
      .send({
        email: 'johnDoe@example.com',
        password: 'password2023',
      })
      .expect(200)

    expect(loginAccountResponse.get('Set-Cookie')).toEqual(sessionId)
  })
})
