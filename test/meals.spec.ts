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

  it('should be able to create a new meal', async () => {
    await request(app.server)
      .post('/meals')
      .send({
        name: 'New meal',
        description: 'This is a new meal',
        mealTime: new Date(),
        isInDiet: true,
      })
      .expect(201)
  })

  it('should be able to list all meals', async () => {
    const createMealResponse = await request(app.server)
      .post('/meals')
      .send({
        name: 'New meal',
        description: 'This is a new meal',
        mealTime: new Date('2003-05-10T00:00:00.000Z'),
        isInDiet: true,
      })
      .expect(201)

    const cookies = createMealResponse.get('Set-Cookie')

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200)

    expect(listMealsResponse.body.meals).toEqual([
      expect.objectContaining({
        name: 'New meal',
        description: 'This is a new meal',
        meal_time: '2003-05-10T00:00:00.000Z',
        is_in_diet: 1,
      }),
    ])
  })

  it('should be able to get a specific meal', async () => {
    const createMealResponse = await request(app.server)
      .post('/meals')
      .send({
        name: 'New meal',
        description: 'This is a new meal',
        mealTime: new Date('2003-05-10T00:00:00.000Z'),
        isInDiet: true,
      })
      .expect(201)

    const cookies = createMealResponse.get('Set-Cookie')

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200)

    const mealId = listMealsResponse.body.meals[0].id

    const getMealResponse = await request(app.server)
      .get(`/meals/${mealId}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(getMealResponse.body.meal).toEqual(
      expect.objectContaining({
        name: 'New meal',
        description: 'This is a new meal',
        meal_time: '2003-05-10T00:00:00.000Z',
        is_in_diet: 1,
      }),
    )
  })

  it('should be able to update a meal', async () => {
    const createMealResponse = await request(app.server)
      .post('/meals')
      .send({
        name: 'New meal',
        description: 'This is a new meal',
        mealTime: new Date('2003-05-10T00:00:00.000Z'),
        isInDiet: true,
      })
      .expect(201)

    const cookies = createMealResponse.get('Set-Cookie')

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200)

    const mealId = listMealsResponse.body.meals[0].id

    await request(app.server)
      .put(`/meals/${mealId}`)
      .set('Cookie', cookies)
      .send({
        name: 'Meal updated',
        description: 'This is an updated meal',
        mealTime: new Date('2023-05-10T00:00:00.000Z'),
        isInDiet: false,
      })
      .expect(200)

    const listMealsResponseAfterUpdating = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200)

    expect(listMealsResponseAfterUpdating.body.meals).toEqual([
      expect.objectContaining({
        name: 'Meal updated',
        description: 'This is an updated meal',
        meal_time: '2023-05-10T00:00:00.000Z',
        is_in_diet: 0,
      }),
    ])
  })

  it('should be able to get the summary', async () => {
    const createMealResponse = await request(app.server)
      .post('/meals')
      .send({
        name: 'New meal',
        description: 'This is a new meal',
        mealTime: new Date('2003-05-10T00:00:00.000Z'),
        isInDiet: true,
      })
      .expect(201)

    const cookies = createMealResponse.get('Set-Cookie')

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'New meal',
        description: 'This is a new meal',
        mealTime: new Date('2013-05-10T00:00:00.000Z'),
        isInDiet: false,
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'New meal',
        description: 'This is a new meal',
        mealTime: new Date('2023-05-10T00:00:00.000Z'),
        isInDiet: true,
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'New meal',
        description: 'This is a new meal',
        mealTime: new Date('2033-05-10T00:00:00.000Z'),
        isInDiet: true,
      })
      .expect(201)

    const summaryResponse = await request(app.server)
      .get('/meals/summary')
      .set('Cookie', cookies)
      .expect(200)

    expect(summaryResponse.body.summary).toEqual({
      total: 4,
      inDiet: 3,
      outDiet: 1,
      bestSequence: 2,
    })
  })

  it('should be able to delete a meal', async () => {
    const createMealResponse = await request(app.server)
      .post('/meals')
      .send({
        name: 'New meal',
        description: 'This is a new meal',
        mealTime: new Date('2003-05-10T00:00:00.000Z'),
        isInDiet: true,
      })
      .expect(201)

    const cookies = createMealResponse.get('Set-Cookie')

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200)

    const mealId = listMealsResponse.body.meals[0].id

    await request(app.server)
      .delete(`/meals/${mealId}`)
      .set('Cookie', cookies)
      .expect(204)

    const listMealsResponseAfterDeleting = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200)

    expect(listMealsResponseAfterDeleting.body.meals).toEqual([])
  })
})
