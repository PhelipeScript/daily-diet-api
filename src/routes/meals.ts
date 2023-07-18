import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'
import { getBestSequenceMealsInDiet } from '../utils/get-best-sequence-meals-in-diet'

export async function mealsRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const createMealBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      mealTime: z.string().datetime(),
      isInDiet: z.boolean(),
    })

    const { name, description, mealTime, isInDiet } =
      createMealBodySchema.parse(request.body)

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('meals').insert({
      id: randomUUID(),
      session_id: sessionId,
      name,
      description,
      meal_time: mealTime,
      is_in_diet: isInDiet,
    })

    return reply.status(201).send()
  })

  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies

      const meals = await knex('meals').where('session_id', sessionId).select()

      return { meals }
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealParamsSchema.parse(request.params)

      const { sessionId } = request.cookies

      const meal = await knex('meals')
        .where({
          session_id: sessionId,
          id,
        })
        .first()

      if (!meal) {
        return reply.status(404).send({ error: 'id not found.' })
      }

      return { meal }
    },
  )

  app.get(
    '/summary',
    { preHandler: [checkSessionIdExists] },
    async (request) => {
      const { sessionId } = request.cookies

      const summary = await Promise.all([
        await knex('meals')
          .where('session_id', sessionId)
          .count('id', { as: 'total' })
          .first(),

        await knex('meals')
          .where({
            session_id: sessionId,
            is_in_diet: true,
          })
          .count('is_in_diet', { as: 'inDiet' })
          .first(),

        await knex('meals')
          .where({
            session_id: sessionId,
            is_in_diet: false,
          })
          .count('is_in_diet', { as: 'outDiet' })
          .first(),
      ]).then((response) => {
        // eslint-disable-next-line
        const data = response.reduce((acc: any, cur: any) => {
          acc[Object.entries(cur)[0][0]] = Object.entries(cur)[0][1]
          return acc
        }, {})

        return data
      })

      const meals = await knex('meals')
        .where({
          session_id: sessionId,
        })
        .select()

      summary.bestSequence = await getBestSequenceMealsInDiet(meals)

      return { summary }
    },
  )

  app.put(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const createMealBodySchema = z.object({
        name: z.string().trim().min(2).optional(),
        description: z.string().trim().min(2).optional(),
        mealTime: z.string().datetime().optional(),
        isInDiet: z.boolean().optional(),
      })

      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealParamsSchema.parse(request.params)
      const { name, description, mealTime, isInDiet } =
        createMealBodySchema.parse(request.body)
      const { sessionId } = request.cookies

      const isUpdated = await knex('meals')
        .where({
          session_id: sessionId,
          id,
        })
        .update({
          name,
          description,
          meal_time: mealTime,
          is_in_diet: isInDiet,
        })

      if (!isUpdated) {
        return reply.status(401).send({ error: 'id not found.' })
      }

      return reply.status(200).send()
    },
  )

  app.delete(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealParamsSchema.parse(request.params)
      const { sessionId } = request.cookies

      const isDeleted = await knex('meals')
        .where({
          session_id: sessionId,
          id,
        })
        .delete()

      if (!isDeleted) {
        return reply.status(401).send({ error: 'id not found.' })
      }

      return reply.status(204).send()
    },
  )
}
