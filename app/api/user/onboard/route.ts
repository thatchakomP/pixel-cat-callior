// app/api/user/onboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

import prisma from '../../../../lib/prisma'
import {
    calculateBMI,
    getBMICategory,
    calculateDailyCalorieTarget,
    generateCatPrompt,
} from '../../../../lib/utils'
import { generateCatWithReplicate } from '../../../../lib/aiService'

const secret = process.env.NEXTAUTH_SECRET

export async function POST(request: NextRequest) {
    const token = await getToken({ req: request, secret: secret })
    if (!token || !token.id) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const userId = token.id as string

    const { name, age, gender, heightCm, weightKg, goals } = await request.json()

    if (
        !userId ||
        !name ||
        !age ||
        !gender ||
        !heightCm ||
        !weightKg ||
        !goals ||
        !Array.isArray(goals)
    ) {
        return NextResponse.json(
            { message: 'All required fields are missing or invalid.' },
            { status: 400 }
        )
    }

    if (userId !== token.id) {
        return NextResponse.json({ message: 'Unauthorized: User ID mismatch.' }, { status: 403 })
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) {
            return NextResponse.json({ message: 'User not found.' }, { status: 404 })
        }

        if (user.activeCatId) {
            return NextResponse.json({ message: 'User already onboarded.' }, { status: 409 })
        }

        const bmi = calculateBMI(weightKg, heightCm)
        const bmiCategory = getBMICategory(bmi)
        const dailyCalorieTarget = calculateDailyCalorieTarget(
            gender,
            age,
            heightCm,
            weightKg,
            goals
        )

        const catPrompt = generateCatPrompt(bmiCategory, goals)

        // --- Call Replicate Service for Cat Image ---
        const replicateResponse = await generateCatWithReplicate(catPrompt)
        const catImageUrl = String(replicateResponse.imageUrl) // <--- EXPLICITLY CONVERT TO STRING HERE

        // --- DEBUG LOG ---
        console.log('DEBUG: Value of catImageUrl before Prisma create:', catImageUrl)
        console.log('DEBUG: Type of catImageUrl before Prisma create:', typeof catImageUrl)
        // --- END DEBUG LOG ---

        const initialCat = await prisma.cat.create({
            data: {
                name: `${bmiCategory.charAt(0).toUpperCase() + bmiCategory.slice(1)} Cat`,
                imageUrl: catImageUrl, // This will now be a guaranteed string
                bodyType: bmiCategory,
                descriptionPrompt: catPrompt,
                isDefault: true,
                unlockCriteria: {},
            },
        })

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                age,
                gender,
                heightCm,
                weightKg,
                bmi,
                goals,
                dailyCalorieTarget: Math.round(dailyCalorieTarget),
                activeCatId: initialCat.id,
                unlockedCats: {
                    connect: { id: initialCat.id },
                },
            },
            include: {
                activeCat: true,
                unlockedCats: true,
            },
        })

        const { password: _, ...userWithoutPassword } = updatedUser
        return NextResponse.json(
            { message: 'Onboarding complete!', user: userWithoutPassword },
            { status: 200 }
        )
    } catch (error: unknown) {
        let errorMessage = 'An unknown error occurred.'
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
        console.error('Onboarding error during Replicate generation or DB update:', error)
        return NextResponse.json(
            { message: `Failed to complete onboarding: ${errorMessage}` },
            { status: 500 }
        )
    }
}
