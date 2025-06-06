// lib/utils.ts
import { User, Cat } from '@prisma/client' // Import Prisma model types
import prisma from './prisma' // Import your Prisma Client instance
// Import BOTH Replicate AI generation functions for the two-stage pipeline
import { generateStaticPixelCat, generateAnimatedPixelCat } from './aiService'

// Define and EXPORT the BMICategoryType alias at the very top.
// This makes it available for use as a type throughout this file and for external imports.
export type BMICategoryType = 'slim' | 'normal' | 'fat' | 'obese'

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
 * @returns A string representing the BMI category (from BMICategoryType).
 */
export const getBMICategory = (bmi: number): BMICategoryType => {
    // Uses the exported type alias
    if (bmi < 18.5) return 'slim'
    if (bmi >= 18.5 && bmi < 24.9) return 'normal'
    if (bmi >= 25 && bmi < 29.9) return 'fat'
    return 'obese' // BMI >= 30
}

/**
 * Calculates the estimated daily calorie target based on user's demographic data and goals.
 * Uses a simplified Mifflin-St Jeor Equation for Basal Metabolic Rate (BMR) and a sedentary activity level.
 * @param gender User's gender.
 * @param age User's age.
 * @param heightCm User's height.
 * @param weightKg User's weight.
 * @param goals An array of user's health goals.
 * @returns The estimated daily calorie target.
 */
export const calculateDailyCalorieTarget = (
    // Correctly exported
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
 * Generates a descriptive prompt string for AI image generation services (like Replicate)
 * for the STATIC cat image, based on the user's BMI category and health goals.
 * @param bmiCategory The user's BMI category (uses BMICategoryType).
 * @param goals An array of user's health goals.
 * @returns A string prompt for the static AI image generation.
 */
export const generateCatPrompt = (
    // Correctly exported
    bmiCategory: BMICategoryType, // Uses the exported type alias
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

    // Prompt components for the STATIC cat image
    let cuteDesc =
        'cute, adorable, happy, smiling, joyful expression, chibi style, small body, big head, rounded features'
    let colorDesc = 'orange tabby cat'
    let poseDesc = 'sitting, front view, one paw raised'

    return `${bodyDesc} ${colorDesc}, ${goalDesc.trim()}, ${cuteDesc}, ${poseDesc}.`
}

/**
 * Generates a descriptive prompt string for the animation aspect of the AI video generation.
 * This is used for the second stage of the AI pipeline (animating the static image).
 * @param catName The name of the cat (for context in the prompt).
 * @param goals An array of user's health goals (to influence animation style).
 * @returns A string prompt for the AI video generation's animation aspect.
 */
export const generateAnimationPrompt = (catName: string, goals: string[]): string => {
    // Correctly exported
    if (goals.includes('increase protein')) {
        return 'lifting a small dumbbell repeatedly'
    }
    if (goals.includes('be slimmer')) {
        return 'doing a quick jump in place'
    }
    if (goals.includes('reduce carbohydrate')) {
        return 'doing a vigorous head shake'
    }
    // Default animation prompt
    return 'simple happy idle movement, wagging tail, blinking eyes'
}

/**
 * Checks if the user's currentCaloriesToday needs to be reset to 0 based on the last update date.
 * This is crucial for daily tracking.
 * @param user The user object including the 'updatedAt' field and required relations.
 * @returns The user object with 'currentCaloriesToday' reset to 0 if a new day has started, otherwise the original user object.
 */
export const resetDailyCaloriesIfNewDay = (
    user: User & { activeCat: Cat | null; unlockedCats: Cat[] }
): User & { activeCat: Cat | null; unlockedCats: Cat[] } => {
    // Correctly exported
    const lastUpdateDate = user.updatedAt
    const today = new Date()

    const lastUpdateYearUTC = lastUpdateDate.getUTCFullYear()
    const lastUpdateMonthUTC = lastUpdateDate.getUTCMonth()
    const lastUpdateDayUTC = lastUpdateDate.getUTCDate()

    const todayYearUTC = today.getUTCFullYear()
    const todayMonthUTC = today.getUTCMonth()
    const todayDayUTC = today.getUTCDate()

    const needsReset =
        lastUpdateYearUTC < todayYearUTC ||
        (lastUpdateYearUTC === todayYearUTC && lastUpdateMonthUTC < todayMonthUTC) ||
        (lastUpdateYearUTC === todayYearUTC &&
            lastUpdateMonthUTC === todayMonthUTC &&
            lastUpdateDayUTC < todayDayUTC)

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
        return { ...user, currentCaloriesToday: 0 }
    }
    console.log(
        `  No reset needed for user ${user.id}. Current Calories Today: ${user.currentCaloriesToday}`
    )
    console.log('--- DEBUG: Daily Reset Check (End) ---')
    return user
}

/**
 * Finds the next cat that the user can unlock based on their current progress and already unlocked cats.
 * @param user The current user object with their unlocked cats.
 * @param allUnlockableCats A list of all potential unlockable cat models from the database.
 * @returns The next Cat object to unlock, or null if all cats are unlocked.
 */
export const findNextUnlockableCat = (
    // Correctly exported
    user: User & { unlockedCats: Cat[] },
    allUnlockableCats: Cat[]
): Cat | null => {
    const alreadyUnlockedIds = new Set(user.unlockedCats.map((cat) => cat.id))

    const availableCats = allUnlockableCats.filter(
        (cat) => !cat.isDefault && !alreadyUnlockedIds.has(cat.id)
    )

    if (availableCats.length === 0) {
        return null
    }

    availableCats.sort((a, b) => {
        const aTotal = (a.unlockCriteria as any)?.totalCalories || Infinity
        const bTotal = (b.unlockCriteria as any)?.totalCalories || Infinity

        if (aTotal !== bTotal) {
            return aTotal - bTotal
        }
        return (a.name || '').localeCompare(b.name || '')
    })

    return availableCats[0]
}

/**
 * Checks if the user has met the criteria to unlock new virtual cat characters.
 * If criteria are met, it performs a two-stage AI generation (static image then animation)
 * and updates the database with the generated video URL.
 * @param userId The ID of the current user.
 * @param user The current user object, including their updated progress metrics and unlocked cats.
 * @returns An array of Cat objects that were newly unlocked during this check.
 */
export const checkAndUnlockNewCats = async (
    // Correctly exported
    userId: string,
    user: User & { unlockedCats: Cat[] }
): Promise<Cat[]> => {
    const newlyUnlockedCats: Cat[] = []

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

    const potentialNewCats = await prisma.cat.findMany({
        where: {
            isDefault: false,
            id: { notIn: user.unlockedCats.map((cat) => cat.id) },
        },
    })

    console.log(
        '  Potential new cats to check against:',
        potentialNewCats.map((cat) => cat.name || cat.id)
    )

    for (const cat of potentialNewCats) {
        const criteria = cat.unlockCriteria as any
        let meetsCriteria = true

        console.log(`  --- Checking cat: ${cat.name || cat.id} ---`)
        console.log("    Cat's unlock criteria:", criteria)

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

        if (meetsCriteria) {
            console.log(`    >>> UNLOCK CONDITION MET for: ${cat.name || cat.id} <<<`)

            let generatedVideoUrl: string = ''
            try {
                // --- STAGE 1: Generate the STATIC pixel art image ---
                console.log(
                    `    Attempting to generate STATIC image for "${cat.name}" with prompt: "${cat.descriptionPrompt}"`
                )
                const { imageUrl: staticGeneratedImageUrl } = await generateStaticPixelCat(
                    cat.descriptionPrompt
                )

                // --- STAGE 2: Animate the STATIC image ---
                const animationPrompt = generateAnimationPrompt(cat.name || 'default', user.goals)
                console.log(
                    `    Attempting to generate VIDEO for "${cat.name}" using static image: "${staticGeneratedImageUrl}" and animation prompt: "${animationPrompt}"`
                )
                const { videoUrl } = await generateAnimatedPixelCat(
                    staticGeneratedImageUrl,
                    animationPrompt
                )
                generatedVideoUrl = String(videoUrl) // Explicitly ensure it's a string

                console.log(
                    `    Video generated successfully for "${cat.name}": ${generatedVideoUrl}`
                )

                // Update the Cat record in the database with the newly generated VIDEO URL
                await prisma.cat.update({
                    where: { id: cat.id },
                    data: { videoUrl: generatedVideoUrl },
                })
                console.log(`    Cat record for "${cat.name}" updated with video URL in DB.`)

                newlyUnlockedCats.push({ ...cat, videoUrl: generatedVideoUrl })
            } catch (genError: unknown) {
                let errorMessage = 'Failed to generate cat video.'
                if (genError instanceof Error) {
                    errorMessage = genError.message
                } else if (
                    typeof genError === 'object' &&
                    genError !== null &&
                    'message' in genError &&
                    typeof (genError as any).message === 'string'
                ) {
                    errorMessage = (genError as any).message
                }
                console.error(
                    `    ERROR: Failed to generate or save video for "${cat.name}": ${errorMessage}`
                )
                newlyUnlockedCats.push(cat) // Push original cat if video gen fails
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
