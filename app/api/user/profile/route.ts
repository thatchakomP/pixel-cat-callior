// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import prisma from '../../../../lib/prisma'
import { resetDailyCaloriesIfNewDay, findNextUnlockableCat } from '../../../../lib/utils' // Make sure findNextUnlockableCat is also imported

const secret = process.env.NEXTAUTH_SECRET

export async function GET(request: NextRequest) {
    const token = await getToken({ req: request, secret: secret })
    if (!token || !token.id) {
        console.warn('[API Profile GET] Not authenticated: No token or token.id found.')
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const userId = token.id as string

    try {
        let user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                activeCat: true,
                unlockedCats: true,
            },
        })

        if (!user) {
            console.warn(`[API Profile GET] User not found for ID: ${userId}`)
            return NextResponse.json({ message: 'User not found.' }, { status: 404 })
        }

        // --- Daily Calorie Reset Logic ---
        const userBeforeResetCheck = { ...user } // Clone for comparison
        const userAfterResetCheck = resetDailyCaloriesIfNewDay(user) // Calls the util function

        // If the util function returned a user with currentCaloriesToday === 0
        // AND the original user's currentCaloriesToday was > 0 (meaning a reset truly occurred)
        if (
            userAfterResetCheck.currentCaloriesToday === 0 &&
            userBeforeResetCheck.currentCaloriesToday > 0
        ) {
            console.log(
                `[API Profile GET] Detected new day and non-zero calories. Performing DB reset for user ${userId}.`
            )
            user = await prisma.user.update({
                where: { id: userId },
                data: { currentCaloriesToday: 0 },
                include: { activeCat: true, unlockedCats: true }, // Re-fetch relations to ensure consistency
            })
            console.log(
                `[API Profile GET] DB reset complete for user ${userId}. currentCaloriesToday now: ${user.currentCaloriesToday}`
            )
        } else {
            console.log(
                `[API Profile GET] No DB reset needed for user ${userId}. currentCaloriesToday: ${user.currentCaloriesToday}`
            )
            user = userAfterResetCheck // Use the user object (potentially unchanged)
        }
        // --- End Daily Calorie Reset Logic ---

        // --- Find Next Unlockable Cat Logic (as is) ---
        const allUnlockableCats = await prisma.cat.findMany({
            where: { isDefault: false },
        })
        const nextUnlockCat = findNextUnlockableCat(user, allUnlockableCats) // `user` here has the latest calories
        console.log(
            `[API Profile GET] Next unlockable cat for user ${userId}: ${
                nextUnlockCat ? nextUnlockCat.name : 'None'
            }`
        )
        // --- End Find Next Unlockable Cat Logic ---

        const { password: _, ...userWithoutPassword } = user
        return NextResponse.json({ user: userWithoutPassword, nextUnlockCat }, { status: 200 })
    } catch (error) {
        console.error(
            `[API Profile GET] Failed to fetch or process user profile for ID ${userId}:`,
            error
        )
        return NextResponse.json(
            { message: 'Failed to load user profile due to server error.' },
            { status: 500 }
        )
    }
}

/**
 * PUT handler to update the authenticated user's profile.
 * Currently used for setting the user's active (displayed) cat.
 */
export async function PUT(request: NextRequest) {
    // 1. Authenticate the user
    const token = await getToken({ req: request, secret: secret })
    if (!token || !token.id) {
        console.warn('[API Profile PUT] Authentication failed: No valid token or token.id found.')
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const userId = token.id as string // Get user ID from the authenticated token
    const { activeCatId } = await request.json() // Extract 'activeCatId' from the request body

    // 2. Validate Request Body
    if (!activeCatId) {
        console.warn(`[API Profile PUT] Missing activeCatId in request for user ID: ${userId}`)
        return NextResponse.json({ message: 'activeCatId is required.' }, { status: 400 })
    }

    try {
        // 3. Update User Profile in the Database
        // Update the 'activeCatId' field for the specific user.
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { activeCatId },
            // Include relations so the client's Zustand store can be fully updated with the latest user state.
            include: {
                activeCat: true,
                unlockedCats: true,
            },
        })

        // 4. Prepare and Return Response
        // Exclude the sensitive password hash.
        const { password: _, ...userWithoutPassword } = updatedUser

        console.log(
            `[API Profile PUT] User ${userId} successfully updated active cat to ID: ${activeCatId}.`
        )
        return NextResponse.json(
            { message: 'User profile updated.', user: userWithoutPassword },
            { status: 200 }
        )
    } catch (error) {
        console.error(`[API Profile PUT] Failed to update user profile for ID ${userId}:`, error)
        return NextResponse.json(
            { message: 'Failed to update user profile due to server error.' },
            { status: 500 }
        )
    }
}
