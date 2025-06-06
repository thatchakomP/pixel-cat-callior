// app/api/food/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

import prisma from '../../../../lib/prisma'
import { cloudinary } from '../../../../lib/cloudinary'
import { detectFoodWithReplicate } from '../../../../lib/aiService'
import { checkAndUnlockNewCats, getBMICategory } from '../../../../lib/utils' // <--- ADDED getBMICategory here

const secret = process.env.NEXTAUTH_SECRET

export async function POST(request: NextRequest) {
    const token = await getToken({ req: request, secret: secret })
    if (!token || !token.id) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const userId = token.id as string // User ID from the authenticated token

    try {
        const formData = await request.formData()
        const foodImageFile = formData.get('foodImage') as File | null

        if (!foodImageFile) {
            return NextResponse.json({ message: 'No image file uploaded.' }, { status: 400 })
        }

        const buffer = Buffer.from(await foodImageFile.arrayBuffer())

        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader
                .upload_stream(
                    {
                        folder: `pixel-cat-calories/food-logs/${userId}`,
                        public_id: `food-${Date.now()}`,
                        resource_type: 'image',
                    },
                    (error, result) => {
                        if (error) reject(error)
                        else resolve(result)
                    }
                )
                .end(buffer)
        })

        const uploadedImageUrl = (uploadResult as any).secure_url

        // 2. Call AI Service for Food Detection
        const { detectedFoods, totalCalories } = await detectFoodWithReplicate(uploadedImageUrl)

        // 3. Log food entry
        const foodLog = await prisma.foodLogEntry.create({
            data: {
                userId: userId,
                imageUrl: uploadedImageUrl,
                detectedFoods: detectedFoods,
                totalCalories: totalCalories,
            },
        })

        // 4. Update user's current and lifetime calories
        // Fetch the user again to get the latest state including relations (unlockedCats)
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                activeCat: true,
                unlockedCats: true, // IMPORTANT: Ensure this is included for checkAndUnlockNewCats
            },
        })

        if (!user) {
            return NextResponse.json({ message: 'User not found after food log.' }, { status: 404 })
        }

        const updatedCurrentCaloriesToday = user.currentCaloriesToday + totalCalories
        const updatedTotalLifetimeCalories = user.totalLifetimeCalories + totalCalories

        // --- DEBUG UNLOCK START ---
        console.log('--- DEBUG UNLOCK ---')
        console.log('User ID:', userId)
        console.log(
            'User current total lifetime calories (before update):',
            user.totalLifetimeCalories
        )
        console.log('Calories from this upload:', totalCalories)
        console.log('User new total lifetime calories (for check):', updatedTotalLifetimeCalories)
        console.log('User goals:', user.goals)
        console.log('User BMI:', user.bmi)
        if (user.bmi) {
            console.log('User BMI category:', getBMICategory(user.bmi)) // <--- Using getBMICategory
        } else {
            console.log('User BMI category: N/A (BMI not set)')
        }
        // --- DEBUG UNLOCK END ---

        // 5. Check for new cat unlocks (pass the user object with updated values for the check)
        const newlyUnlockedCats = await checkAndUnlockNewCats(userId, {
            ...user, // Pass the original user object with relations
            currentCaloriesToday: updatedCurrentCaloriesToday, // Override these for the check
            totalLifetimeCalories: updatedTotalLifetimeCalories,
        })

        console.log('Newly unlocked cats from checkAndUnlockNewCats:', newlyUnlockedCats) // <--- DEBUG LOG
        console.log('--- END DEBUG UNLOCK ---') // <--- DEBUG LOG

        // Update user in DB with new calories and any newly unlocked cats
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                currentCaloriesToday: updatedCurrentCaloriesToday,
                totalLifetimeCalories: updatedTotalLifetimeCalories,
                unlockedCats: {
                    connect: newlyUnlockedCats.map((cat) => ({ id: cat.id })), // Connect new cats if any
                },
            },
            include: {
                activeCat: true,
                unlockedCats: true, // Re-fetch unlocked cats to ensure latest state for client
            },
        })

        const { password: _, ...userWithoutPassword } = updatedUser

        return NextResponse.json(
            {
                message: 'Food analyzed and logged successfully!',
                foodLog,
                user: userWithoutPassword,
                unlockedCats: newlyUnlockedCats, // Send back only the *newly* unlocked ones
            },
            { status: 200 }
        )
    } catch (error) {
        console.error('Food upload/analysis error:', error)
        return NextResponse.json({ message: 'Failed to process food image.' }, { status: 500 })
    }
}
