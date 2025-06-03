// app/api/user/onboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt' // <--- NEW IMPORT for server-side session in v4

import prisma from '../../../../lib/prisma' // Adjust path
import {
    calculateBMI,
    getBMICategory,
    calculateDailyCalorieTarget,
    generateCatPrompt,
} from '../../../../lib/utils' // Adjust path
import { mockGenerateCat } from '../../../../lib/aiService' // Adjust path

// Define the secret for JWT token verification
const secret = process.env.NEXTAUTH_SECRET

export async function POST(request: NextRequest) {
    // Use getToken to retrieve the JWT token from the request
    const token = await getToken({ req: request, secret: secret })

    // If no token, or token does not contain user ID, consider as unauthenticated
    if (!token || !token.id) {
        // token.id should be set in jwt callback in lib/auth.ts
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const { userId, name, age, gender, heightCm, weightKg, goals } = await request.json()

    // Basic validation
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

    // Ensure the userId from the request body matches the authenticated user's ID
    if (userId !== token.id) {
        return NextResponse.json({ message: 'Unauthorized: User ID mismatch.' }, { status: 403 })
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) {
            return NextResponse.json({ message: 'User not found.' }, { status: 404 })
        }

        // Optional: Check if user is already onboarded (has an active cat) to prevent re-onboarding
        if (user.activeCatId) {
            return NextResponse.json({ message: 'User already onboarded.' }, { status: 409 })
        }

        // 1. Calculate BMI & Daily Calorie Target
        const bmi = calculateBMI(weightKg, heightCm)
        const bmiCategory = getBMICategory(bmi)
        const dailyCalorieTarget = calculateDailyCalorieTarget(
            gender,
            age,
            heightCm,
            weightKg,
            goals
        )

        // 2. Generate AI Cat Prompt
        const catPrompt = generateCatPrompt(bmiCategory, goals)

        // 3. Call AI Service for Cat Image (using mock for now)
        const { imageUrl: catImageUrl } = await mockGenerateCat(catPrompt)

        // 4. Create the initial Cat entry in DB
        const initialCat = await prisma.cat.create({
            data: {
                name: `${bmiCategory.charAt(0).toUpperCase() + bmiCategory.slice(1)} Cat`, // Simple name
                imageUrl: catImageUrl,
                bodyType: bmiCategory,
                descriptionPrompt: catPrompt,
                isDefault: true, // Mark as initial cat
                unlockCriteria: {}, // No unlock criteria for default cat
            },
        })

        // 5. Update User Profile & set active cat
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
                    connect: { id: initialCat.id }, // Connect the initial cat to unlocked cats
                },
            },
            include: {
                activeCat: true, // Include active cat in response
                unlockedCats: true, // Include unlocked cats in response
            },
        })

        const { password: _, ...userWithoutPassword } = updatedUser // Exclude password from response
        return NextResponse.json(
            { message: 'Onboarding complete!', user: userWithoutPassword },
            { status: 200 }
        )
    } catch (error) {
        console.error('Onboarding error:', error)
        return NextResponse.json({ message: 'Failed to complete onboarding.' }, { status: 500 })
    }
}
