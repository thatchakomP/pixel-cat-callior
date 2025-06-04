// lib/utils.ts
import { User, Cat } from '@prisma/client' // Import Prisma model types
import prisma from './prisma' // Import your Prisma Client instance
import { generateCatWithReplicate } from './aiService' // Import the Replicate AI service for cat generation

/**
 * Calculates the Body Mass Index (BMI).
 * @param weightKg User's weight in kilograms.
 * @param heightCm User's height in centimeters.
 * @returns The calculated BMI as a number.
 */
export const calculateBMI = (weightKg: number, heightCm: number): number => {
    if (heightCm === 0) return 0 // Avoid division by zero
    const heightM = heightCm / 100 // Convert cm to meters
    return parseFloat((weightKg / (heightM * heightM)).toFixed(2)) // BMI formula
}

/**
 * Determines the BMI category based on the calculated BMI value.
 * @param bmi The calculated BMI.
 * @returns A string representing the BMI category.
 */
export const getBMICategory = (bmi: number): 'slim' | 'normal' | 'fat' | 'obese' => {
    if (bmi < 18.5) return 'slim'
    if (bmi >= 18.5 && bmi < 24.9) return 'normal'
    if (bmi >= 25 && bmi < 29.9) return 'fat'
    return 'obese' // BMI >= 30
}

/**
 * Calculates the estimated daily calorie target based on user's demographic data and goals.
 * Uses a simplified Mifflin-St Jeor Equation for Basal Metabolic Rate (BMR) and a sedentary activity level.
 * @param gender User's gender ('male' or 'female').
 * @param age User's age in years.
 * @param heightCm User's height in centimeters.
 * @param weightKg User's weight in kilograms.
 * @param goals An array of user's health goals (e.g., "be slimmer", "increase protein").
 * @returns The estimated daily calorie target.
 */
export const calculateDailyCalorieTarget = (
    gender: string,
    age: number,
    heightCm: number,
    weightKg: number,
    goals: string[]
): number => {
    let bmr: number
    // Mifflin-St Jeor Equation for BMR
    if (gender === 'male') {
        bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    } else {
        // female
        bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161
    }

    // Assume Sedentary (1.2 multiplier) for Total Daily Energy Expenditure (TDEE)
    let tdee = bmr * 1.2

    // Adjust TDEE based on user's specific health goals
    if (goals.includes('be slimmer')) {
        return Math.max(1200, tdee - 500) // 500 calorie deficit for weight loss, with a minimum of 1200 kcal
    } else if (goals.includes('be fatter')) {
        return tdee + 500 // 500 calorie surplus for weight gain
    } else if (goals.includes('increase protein')) {
        return tdee // For protein goals, focus is on macro composition, not necessarily calorie change
    }
    // Default: maintain weight
    return tdee
}

/**
 * Generates a descriptive prompt string for AI image generation services (like Replicate/DALL-E)
 * based on the user's BMI category and health goals.
 * @param bmiCategory The user's BMI category ('slim', 'normal', 'fat', 'obese').
 * @param goals An array of user's health goals.
 * @returns A string prompt for the AI image generation.
 */
export const generateCatPrompt = (
    bmiCategory: ReturnType<typeof getBMICategory>,
    goals: string[]
): string => {
    let bodyDesc = ''
    switch (bmiCategory) {
        case 'slim':
            bodyDesc = 'a slender, agile'
            break
        case 'normal':
            bodyDesc = 'a healthy, balanced'
            break
        case 'fat':
            bodyDesc = 'a chubby, cuddly'
            break
        case 'obese':
            bodyDesc = 'a very round, plump'
            break
    }

    let goalDesc = ''
    if (goals.includes('be slimmer')) goalDesc += ' trying to lose weight, focused, '
    if (goals.includes('be fatter')) goalDesc += ' trying to gain weight, hungry, '
    if (goals.includes('reduce carbohydrate')) goalDesc += ' avoiding carbs, disciplined, '
    if (goals.includes('increase protein')) goalDesc += ' building muscle, strong, '
    if (goals.includes('maintain weight')) goalDesc += ' balanced, serene, '

    let cuteDesc =
        'cute, adorable, happy, smiling, joyful expression, chibi style, small body, big head, rounded features, one paw raised'
    let colorDesc = 'orange tabby cat'

    // The core prompt components are combined. Replicate handles the "pixel art" styling itself.
    return `${bodyDesc} ${colorDesc}, ${goalDesc.trim()}, ${cuteDesc}, simple background.`
}

/**
 * Checks if the user's currentCaloriesToday needs to be reset to 0 based on the last update date.
 * This is crucial for daily tracking.
 * @param user The user object including the 'updatedAt' field.
 * @returns The user object with 'currentCaloriesToday' reset to 0 if a new day has started, otherwise the original user object.
 */
export const resetDailyCaloriesIfNewDay = (
    user: User & { activeCat: Cat | null; unlockedCats: Cat[] }
): User & { activeCat: Cat | null; unlockedCats: Cat[] } => {
    const lastUpdateDate = user.updatedAt // Timestamp of the last user update from Prisma
    const today = new Date() // Current date and time

    // Get UTC components for a reliable day-by-day comparison, avoiding timezone issues
    const lastUpdateYearUTC = lastUpdateDate.getUTCFullYear()
    const lastUpdateMonthUTC = lastUpdateDate.getUTCMonth()
    const lastUpdateDayUTC = lastUpdateDate.getUTCDate()

    const todayYearUTC = today.getUTCFullYear()
    const todayMonthUTC = today.getUTCMonth()
    const todayDayUTC = today.getUTCDate()

    // Determine if the UTC date has changed since the last update
    const needsReset =
        lastUpdateYearUTC < todayYearUTC || // Different year
        (lastUpdateYearUTC === todayYearUTC && lastUpdateMonthUTC < todayMonthUTC) || // Same year, different month
        (lastUpdateYearUTC === todayYearUTC &&
            lastUpdateMonthUTC === todayMonthUTC &&
            lastUpdateDayUTC < todayDayUTC) // Same year/month, different day

    // --- DEBUG LOGS FOR RESET ---
    console.log('--- DEBUG: Daily Reset Check (Start) ---')
    console.log(`  User ID: ${user.id}`)
    console.log(`  Last Updated At (UTC): ${lastUpdateDate.toISOString()}`)
    console.log(`  Current Date (UTC): ${today.toISOString()}`)
    console.log(
        `  Comparison (Last Update UTC Day < Today UTC Day): ${lastUpdateDayUTC < todayDayUTC}`
    )
    console.log(`  Needs Reset? ${needsReset}`)
    console.log(`  Current Calories Today (before potential reset): ${user.currentCaloriesToday}`)
    console.log('--- END DEBUG LOGS ---')

    if (needsReset) {
        console.log(`  >>> RESETTING currentCaloriesToday for user ${user.id} <<<`)
        return { ...user, currentCaloriesToday: 0 } // Return a new object with calories reset
    }
    console.log(
        `  No reset needed for user ${user.id}. Current Calories Today: ${user.currentCaloriesToday}`
    )
    console.log('--- DEBUG: Daily Reset Check (End) ---')
    return user // Return the original user object if no reset is necessary
}

/**
 * Finds the next cat that the user can unlock based on their current progress and already unlocked cats.
 * @param user The current user object with their unlocked cats.
 * @param allUnlockableCats A list of all potential unlockable cat models from the database.
 * @returns The next Cat object to unlock, or null if all cats are unlocked.
 */
export const findNextUnlockableCat = (
    user: User & { unlockedCats: Cat[] },
    allUnlockableCats: Cat[]
): Cat | null => {
    // Create a Set for efficient lookup of already unlocked cat IDs
    const alreadyUnlockedIds = new Set(user.unlockedCats.map((cat) => cat.id))

    // Filter out cats that are default or already unlocked by the user
    const availableCats = allUnlockableCats.filter(
        (cat) => !cat.isDefault && !alreadyUnlockedIds.has(cat.id)
    )

    if (availableCats.length === 0) {
        return null // No more cats left to unlock
    }

    // Sort available cats primarily by their 'totalCalories' unlock criteria for progression.
    // Cats with lower total calorie requirements will appear first.
    availableCats.sort((a, b) => {
        const aTotal = (a.unlockCriteria as any)?.totalCalories || Infinity // Treat missing criteria as very high
        const bTotal = (b.unlockCriteria as any)?.totalCalories || Infinity

        if (aTotal !== bTotal) {
            return aTotal - bTotal // Sort ascending by totalCalories
        }
        // If totalCalories are the same, sort alphabetically by name for consistent order
        return (a.name || '').localeCompare(b.name || '')
    })

    // The first cat in the sorted list is the "next" one the user is working towards
    return availableCats[0]
}

/**
 * Checks if the user has met the criteria to unlock new virtual cat characters.
 * If criteria are met, it generates the cat's image via Replicate and updates the database.
 * @param userId The ID of the current user.
 * @param user The current user object, including their updated progress metrics and unlocked cats.
 * @returns An array of Cat objects that were newly unlocked during this check.
 */
export const checkAndUnlockNewCats = async (
    userId: string,
    user: User & { unlockedCats: Cat[] }
): Promise<Cat[]> => {
    const newlyUnlockedCats: Cat[] = [] // Collects cats that are unlocked in this specific check

    // --- DEBUG LOGS ---
    console.log('--- DEBUG: checkAndUnlockNewCats (Start) ---')
    console.log('  User ID being checked:', userId)
    console.log(
        "  User's current unlocked cats:",
        user.unlockedCats.map((cat) => cat.name || cat.id)
    )
    console.log("  User's totalLifetimeCalories:", user.totalLifetimeCalories)
    console.log("  User's goals:", user.goals)
    console.log("  User's BMI:", user.bmi)
    if (user.bmi) {
        console.log("  User's BMI category:", getBMICategory(user.bmi))
    }
    console.log('--- END DEBUG: checkAndUnlockNewCats (Start) ---')

    // Fetch all potential unlockable cats that the user has NOT yet unlocked
    const potentialNewCats = await prisma.cat.findMany({
        where: {
            isDefault: false, // Exclude the default cat
            id: { notIn: user.unlockedCats.map((cat) => cat.id) }, // Exclude already unlocked cats
        },
    })

    console.log(
        '  Potential new cats to check against:',
        potentialNewCats.map((cat) => cat.name || cat.id)
    )

    // Iterate through each potential new cat to check if criteria are met
    for (const cat of potentialNewCats) {
        const criteria = cat.unlockCriteria as any // Cast to 'any' for flexible JSON access
        let meetsCriteria = true // Assume met until proven otherwise

        // --- DEBUG LOG: Checking individual cat ---
        console.log(`  --- Checking cat: ${cat.name || cat.id} ---`)
        console.log("    Cat's unlock criteria:", criteria)
        // --- END DEBUG LOGS ---

        // Check against total lifetime calories criteria
        if (criteria.totalCalories) {
            if (user.totalLifetimeCalories < criteria.totalCalories) {
                meetsCriteria = false
                console.log(
                    `    - FAILED: totalCalories. User (${user.totalLifetimeCalories}) < Required (${criteria.totalCalories})`
                )
            } else {
                console.log(
                    `    - PASSED: totalCalories. User (${user.totalLifetimeCalories}) >= Required (${criteria.totalCalories})`
                )
            }
        }

        // Check against goal match criteria (user must have ALL specified goals)
        if (
            meetsCriteria &&
            criteria.goalMatch &&
            Array.isArray(criteria.goalMatch) &&
            criteria.goalMatch.length > 0
        ) {
            const userHasAllGoals = criteria.goalMatch.every((goal: string) =>
                user.goals.includes(goal)
            )
            if (!userHasAllGoals) {
                meetsCriteria = false
                console.log(
                    `    - FAILED: goalMatch. User goals: [${user.goals}], Required: [${criteria.goalMatch}]`
                )
            } else {
                console.log(`    - PASSED: goalMatch. User has all required goals.`)
            }
        }

        // Check against BMI target criteria
        if (meetsCriteria && criteria.bmiTarget && user.bmi) {
            const currentBMICategory = getBMICategory(user.bmi)
            if (currentBMICategory !== criteria.bmiTarget) {
                meetsCriteria = false
                console.log(
                    `    - FAILED: bmiTarget. User BMI category: ${currentBMICategory}, Required: ${criteria.bmiTarget}`
                )
            } else {
                console.log(`    - PASSED: bmiTarget. User BMI category matches required.`)
            }
        }

        // If all criteria for this cat are met
        if (meetsCriteria) {
            console.log(`    >>> UNLOCK CONDITION MET for: ${cat.name || cat.id} <<<`)

            let generatedImageUrl: string = ''
            try {
                // --- Call Replicate to generate image for this unlocked cat ---
                console.log(
                    `    Attempting to generate image for "${cat.name}" with prompt: "${cat.descriptionPrompt}"`
                )
                const { imageUrl } = await generateCatWithReplicate(cat.descriptionPrompt)
                generatedImageUrl = String(imageUrl) // Explicitly convert to string to prevent ReadableStream issue
                console.log(
                    `    Image generated successfully for "${cat.name}": ${generatedImageUrl}`
                )

                // Update the Cat record in the database with the newly generated image URL
                await prisma.cat.update({
                    where: { id: cat.id },
                    data: { imageUrl: generatedImageUrl },
                })
                console.log(`    Cat record for "${cat.name}" updated with image URL in DB.`)

                // Add the updated cat object (with its new image URL) to the list of newly unlocked cats
                newlyUnlockedCats.push({ ...cat, imageUrl: generatedImageUrl })
            } catch (imgGenError: unknown) {
                // Catch as unknown for type safety
                let imgErrorMessage = 'Failed to generate image.'
                if (imgGenError instanceof Error) {
                    imgErrorMessage = imgGenError.message
                } else if (
                    typeof imgGenError === 'object' &&
                    imgGenError !== null &&
                    'message' in imgGenError &&
                    typeof (imgGenError as any).message === 'string'
                ) {
                    imgErrorMessage = (imgGenError as any).message
                }
                console.error(
                    `    ERROR: Failed to generate or save image for "${cat.name}": ${imgErrorMessage}`
                )
                // If image generation fails, the cat is still considered "unlocked" by criteria,
                // but its image might be missing. Push the original cat object without the new URL.
                newlyUnlockedCats.push(cat)
            }
        } else {
            console.log(`    >>> RESULT: ${cat.name || cat.id} - NOT UNLOCKED <<<`)
        }
    }

    console.log('--- DEBUG: checkAndUnlockNewCats (End) ---')
    console.log(
        '  Total newly unlocked cats in this check:',
        newlyUnlockedCats.map((cat) => cat.name || cat.id)
    )
    return newlyUnlockedCats
}
