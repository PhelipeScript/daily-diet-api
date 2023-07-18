import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'

export async function usersRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const createUserBodySchema = z.object({
      name: z.string(),
      email: z.string().email(),
      password: z.string(),
      avatarUrl: z.string().optional(),
    })

    const { name, email, password, avatarUrl } = createUserBodySchema.parse(
      request.body,
    )

    const isEmailAlreadyRegistered = await knex('users')
      .where('email', email)
      .first()
    if (isEmailAlreadyRegistered) {
      return reply.status(409).send({ error: 'email already registered' })
    }

    const isNameAlreadyRegistered = await knex('users')
      .where('name', name)
      .first()
    if (isNameAlreadyRegistered) {
      return reply.status(409).send({ error: 'name already registered' })
    }

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    } else {
      const isSessionIdAlreadyRegistered = await knex('users')
        .where('session_id', sessionId)
        .first()

      if (isSessionIdAlreadyRegistered) {
        return reply.status(409).send({ error: 'sessionId already registered' })
      }
    }

    await knex('users').insert({
      id: randomUUID(),
      session_id: sessionId,
      name,
      email,
      password,
      avatar_url: avatarUrl || undefined,
    })

    return reply.status(201).send()
  })

  app.post('/login', async (request, reply) => {
    const createUserLoginBodySchema = z.object({
      email: z.string().email(),
      password: z.string(),
    })

    const { email, password } = createUserLoginBodySchema.parse(request.body)

    const getUserSessionId = await knex('users')
      .where({ email, password })
      .select('session_id')
      .first()

    if (!getUserSessionId) {
      return reply.status(404).send({ error: 'user not found.' })
    }

    reply.cookie('sessionId', getUserSessionId.session_id, {
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    })
  })
}
