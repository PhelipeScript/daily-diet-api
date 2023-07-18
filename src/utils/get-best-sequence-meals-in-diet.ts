interface Meal {
  id: string
  session_id?: string
  name: string
  description: string
  meal_time: string
  created_at: string
  is_in_diet: boolean
}

export async function getBestSequenceMealsInDiet(meals: Meal[]) {
  let bestSequence = 0
  let sequence = 0

  for (let i = 0; i < meals.length; i++) {
    if (meals[i].is_in_diet) {
      sequence++
    } else {
      sequence = 0
    }

    if (sequence > bestSequence) {
      bestSequence = sequence
    }
  }

  return bestSequence
}
