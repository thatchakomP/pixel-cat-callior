// app/api/user/profile/update-stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import prisma from '../../../../../lib/prisma' // Adjust path if your lib folder is elsewhere
import {
    calculateBMI,
    calculateDailyCalorieTarget,
    findNextUnlockableCat,
} from '../../../../../lib/utils' // Adjust path, import necessary utils

const secret = process.env.NEXTAUTH_SECRET

export async function PUT(request: NextRequest) {
    const token = await getToken({ req: request, secret: secret })
    if (!token || !token.id) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const userId = token.id as string

    try {
        const { weightKg, goals } = await request.json()

        // Validate input
        if (weightKg === undefined || !goals || !Array.isArray(goals)) {
            return NextResponse.json(
                { message: 'Weight (kg) and goals array are required.' },
                { status: 400 }
            )
        }
        if (typeof parseFloat(weightKg) !== 'number' || parseFloat(weightKg) <= 0) {
            return NextResponse.json(
                { message: 'Weight must be a positive number.' },
                { status: 400 }
            )
        }

        // Fetch existing user data to get height, age, gender (needed for calculations)
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        })

        if (!existingUser) {
            return NextResponse.json({ message: 'User not found.' }, { status: 404 })
        }

        // Recalculate BMI and daily calorie target
        // Use existing user's height, age, and gender for these calculations.
        // Provide sensible defaults if these fields are somehow null (though they should be set during onboarding).
        const currentWeightKg = parseFloat(weightKg)
        const newBmi = calculateBMI(currentWeightKg, existingUser.heightCm || 0)
        const newDailyCalorieTarget = calculateDailyCalorieTarget(
            existingUser.gender || 'male',
            existingUser.age || 25,
            existingUser.heightCm || 0,
            currentWeightKg,
            goals
        )

        // Update the user in the database
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                weightKg: currentWeightKg,
                goals,
                bmi: newBmi,
                dailyCalorieTarget: Math.round(newDailyCalorieTarget),
                updatedAt: new Date(), // Explicitly update the updatedAt timestamp
            },
            include: {
                // Re-fetch all necessary relations for the client
                activeCat: true,
                unlockedCats: true,
            },
        })

        // After updating user stats, re-calculate the next unlockable cat
        const allUnlockableCats = await prisma.cat.findMany({
            where: { isDefault: false }, // Get all non-default cats for progression
        })
        const nextUnlockCat = findNextUnlockableCat(updatedUser, allUnlockableCats)
        console.log(
            `[API Update Stats] Next unlockable cat for user ${userId} after update: ${
                nextUnlockCat ? nextUnlockCat.name : 'None'
            }`
        )

        // Exclude password from the response
        const { password: _, ...userWithoutPassword } = updatedUser

        // Return the fully updated user object and the new nextUnlockCat
        return NextResponse.json(
            {
                message: 'User stats updated successfully.',
                user: { ...userWithoutPassword, nextUnlockCat: nextUnlockCat }, // Ensure nextUnlockCat is part of the user object returned
            },
            { status: 200 }
        )
    } catch (error: unknown) {
        let errorMessage = 'An unknown error occurred while updating stats.'
        if (error instanceof Error) {
            errorMessage = error.message
        } else if (
            typeof error === 'object' &&
            error !== null &&
            'message' in error &&
            typeof (error as any).message === 'string'
        ) {
            errorMessage = (error as any).message
        }
        console.error(`[API Update Stats] Error for user ${userId}:`, error)
        return NextResponse.json({ message: errorMessage }, { status: 500 })
    }
}
