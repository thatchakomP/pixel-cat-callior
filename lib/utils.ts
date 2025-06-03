// lib/utils.ts
import { User, Cat } from '@prisma/client'
import prisma from './prisma'

export const calculateBMI = (weightKg: number, heightCm: number): number => {
    if (heightCm === 0) return 0
    const heightM = heightCm / 100
    return parseFloat((weightKg / (heightM * heightM)).toFixed(2))
}

export const getBMICategory = (bmi: number): 'slim' | 'normal' | 'fat' | 'obese' => {
    if (bmi < 18.5) return 'slim'
    if (bmi >= 18.5 && bmi < 24.9) return 'normal'
    if (bmi >= 25 && bmi < 29.9) return 'fat'
    return 'obese' // bmi >= 30
}

// Simplified Basal Metabolic Rate (BMR) and Daily Calorie Needs
export const calculateDailyCalorieTarget = (
    gender: string,
    age: number,
    heightCm: number,
    weightKg: number,
    goals: string[]
): number => {
    let bmr: number
    if (gender === 'male') {
        bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    } else {
        bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161
    }
    let tdee = bmr * 1.2
    if (goals.includes('be slimmer')) {
        return Math.max(1200, tdee - 500)
    } else if (goals.includes('be fatter')) {
        return tdee + 500
    } else if (goals.includes('increase protein')) {
        return tdee
    }
    return tdee
}

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

    const randomAdjectives = ['happy', 'playful', 'curious', 'sleepy', 'energetic']
    const randomPose = ['sitting', 'standing', 'stretching', 'licking paws']
    const randomFurColor = ['brown', 'orange', 'black', 'white', 'calico', 'grey', 'blue']

    const adj = randomAdjectives[Math.floor(Math.random() * randomAdjectives.length)]
    const pose = randomPose[Math.floor(Math.random() * randomPose.length)]
    const fur = randomFurColor[Math.floor(Math.random() * randomFurColor.length)]

    return `8-bit pixel art, ${bodyDesc} cat, ${goalDesc}${adj}, ${pose} pose, ${fur} fur, simple background.`
}

// --- Daily Calorie Reset Logic ---
export const resetDailyCaloriesIfNewDay = (
    user: User & { activeCat: Cat | null; unlockedCats: Cat[] }
): User & { activeCat: Cat | null; unlockedCats: Cat[] } => {
    const lastUpdateDate = user.updatedAt // This is a Date object from Prisma
    const today = new Date() // This is a Date object representing now

    // Get UTC components for comparison
    const lastUpdateYearUTC = lastUpdateDate.getUTCFullYear()
    const lastUpdateMonthUTC = lastUpdateDate.getUTCMonth()
    const lastUpdateDayUTC = lastUpdateDate.getUTCDate()

    const todayYearUTC = today.getUTCFullYear()
    const todayMonthUTC = today.getUTCMonth()
    const todayDayUTC = today.getUTCDate()

    // Check if the UTC date has changed
    const needsReset =
        lastUpdateYearUTC < todayYearUTC ||
        (lastUpdateYearUTC === todayYearUTC && lastUpdateMonthUTC < todayMonthUTC) ||
        (lastUpdateYearUTC === todayYearUTC &&
            lastUpdateMonthUTC === todayMonthUTC &&
            lastUpdateDayUTC < todayDayUTC)

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
    // --- END DEBUG LOGS ---

    if (needsReset) {
        console.log(`  >>> RESETTING currentCaloriesToday for user ${user.id} <<<`)
        return { ...user, currentCaloriesToday: 0 } // Return new object with reset calories
    }
    console.log(
        `  No reset needed for user ${user.id}. Current Calories Today: ${user.currentCaloriesToday}`
    )
    console.log('--- DEBUG: Daily Reset Check (End) ---')
    return user // Return original object if no reset
}

// --- Find Next Unlockable Cat Logic ---
// This helper finds the next cat the user can unlock based on their current progress
export const findNextUnlockableCat = (
    user: User & { unlockedCats: Cat[] },
    allUnlockableCats: Cat[]
): Cat | null => {
    const alreadyUnlockedIds = new Set(user.unlockedCats.map((cat) => cat.id))

    // Filter out cats that are default or already unlocked
    const availableCats = allUnlockableCats.filter(
        (cat) => !cat.isDefault && !alreadyUnlockedIds.has(cat.id)
    )

    if (availableCats.length === 0) {
        return null // No more cats to unlock
    }

    // Sort available cats by their 'totalCalories' criteria for progression
    // (Assuming totalCalories is the primary progression metric)
    availableCats.sort((a, b) => {
        const aTotal = (a.unlockCriteria as any)?.totalCalories || Infinity // Treat missing as very high
        const bTotal = (b.unlockCriteria as any)?.totalCalories || Infinity

        if (aTotal !== bTotal) {
            return aTotal - bTotal // Sort by lowest totalCalories first
        }
        // If totalCalories are the same, sort by other criteria or alphabetically
        return (a.name || '').localeCompare(b.name || '')
    })

    // The first cat in the sorted list is the 'next' one to unlock
    return availableCats[0]
}

// --- Original Unlock Logic (no changes needed here, as it's called by the API route) ---
export const checkAndUnlockNewCats = async (
    userId: string,
    user: User & { unlockedCats: Cat[] }
): Promise<Cat[]> => {
    const unlockedCats: Cat[] = []

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
            unlockedCats.push(cat)
            console.log(`    >>> RESULT: ${cat.name || cat.id} - UNLOCKED <<<`)
        } else {
            console.log(`    >>> RESULT: ${cat.name || cat.id} - NOT UNLOCKED <<<`)
        }
    }

    console.log('--- DEBUG: checkAndUnlockNewCats (End) ---')
    console.log(
        '  Total newly unlocked cats in this check:',
        unlockedCats.map((cat) => cat.name || cat.id)
    )
    return unlockedCats
}
