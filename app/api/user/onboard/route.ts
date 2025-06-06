// app/api/user/onboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

import prisma from '../../../../lib/prisma'
import {
    calculateBMI,
    getBMICategory,
    calculateDailyCalorieTarget,
    generateCatPrompt,
    generateAnimationPrompt,
} from '../../../../lib/utils' // NEW: generateAnimationPrompt
import { generateStaticPixelCat, generateAnimatedPixelCat } from '../../../../lib/aiService' // NEW: Both generation functions

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
        const catNameForPrompt = `${bmiCategory.charAt(0).toUpperCase() + bmiCategory.slice(1)} Cat` // For animation prompt

        let finalVideoUrl: string = ''

        try {
            // --- STAGE 1: Generate the STATIC pixel art image ---
            console.log(
                `[Onboard] Attempting to generate STATIC image for initial cat: "${catPrompt}"`
            )
            const { imageUrl: staticGeneratedImageUrl } = await generateStaticPixelCat(catPrompt)

            // --- STAGE 2: Animate the STATIC image ---
            const animationPrompt = generateAnimationPrompt(catNameForPrompt, goals)
            console.log(
                `[Onboard] Attempting to generate VIDEO for initial cat using static image: "${staticGeneratedImageUrl}" and animation prompt: "${animationPrompt}"`
            )
            const { videoUrl } = await generateAnimatedPixelCat(
                staticGeneratedImageUrl,
                animationPrompt
            )
            finalVideoUrl = String(videoUrl) // Explicitly ensure it's a string

            console.log(`[Onboard] Initial cat video generated successfully: ${finalVideoUrl}`)
        } catch (genError: unknown) {
            let errorMessage = 'Failed to generate initial cat video.'
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
            console.error(`[Onboard] ERROR generating initial cat video: ${errorMessage}`)
            // Fallback: If AI generation fails, provide a generic static image
            finalVideoUrl = '/cats/cat-normal.png' // Fallback to a local static image
            console.warn(`[Onboard] Falling back to default static image: ${finalVideoUrl}`)
        }

        // --- Store the generated (or fallback) video URL ---
        const initialCat = await prisma.cat.create({
            data: {
                name: catNameForPrompt,
                videoUrl: finalVideoUrl,
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
        let errorMessage = 'An unknown error occurred during onboarding process.'
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
        console.error('Onboarding main catch error:', error)
        return NextResponse.json(
            { message: `Failed to complete onboarding: ${errorMessage}` },
            { status: 500 }
        )
    }
}
