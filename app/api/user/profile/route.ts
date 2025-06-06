// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt' // For server-side session authentication with NextAuth.js v4

import prisma from '../../../../lib/prisma' // Your Prisma Client instance
import { resetDailyCaloriesIfNewDay, findNextUnlockableCat } from '../../../../lib/utils' // Utility functions

// The secret for JWT token verification (must match NEXTAUTH_SECRET in .env.local)
const secret = process.env.NEXTAUTH_SECRET

/**
 * GET handler to fetch the authenticated user's profile,
 * reset daily calories if a new day has started, and determine the next unlockable cat.
 */
export async function GET(request: NextRequest) {
    // 1. Authenticate the user
    const token = await getToken({ req: request, secret: secret })
    if (!token || !token.id) {
        console.warn('[API Profile GET] Authentication failed: No valid token or token.id found.')
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const userId = token.id as string // Get user ID from the authenticated token

    try {
        // 2. Fetch the user's profile from the database
        // Include 'activeCat' and 'unlockedCats' relations for client-side display and logic.
        let user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                activeCat: true,
                unlockedCats: true,
            },
        })

        // 3. Handle User Not Found
        if (!user) {
            console.warn(`[API Profile GET] User not found in DB for ID: ${userId}`)
            return NextResponse.json({ message: 'User not found.' }, { status: 404 })
        }

        // 4. Implement Daily Calorie Reset Logic
        const userBeforeResetCheck = { ...user } // Snapshot for comparison
        const userAfterResetCheck = resetDailyCaloriesIfNewDay(user) // Check and get potentially modified user

        // If a reset occurred (currentCaloriesToday was > 0 and is now 0), persist this to the DB.
        if (
            userAfterResetCheck.currentCaloriesToday === 0 &&
            userBeforeResetCheck.currentCaloriesToday > 0
        ) {
            console.log(
                `[API Profile GET] Daily calories reset detected for user ${userId}. Updating DB.`
            )
            // Update the database and re-fetch the user object with relations to ensure 'user' variable is current
            user = await prisma.user.update({
                where: { id: userId },
                data: { currentCaloriesToday: 0, updatedAt: new Date() }, // Also update 'updatedAt'
                include: { activeCat: true, unlockedCats: true },
            })
            console.log(
                `[API Profile GET] DB reset complete for user ${userId}. currentCaloriesToday now: ${user.currentCaloriesToday}`
            )
        } else {
            // If no reset was needed, use the (potentially unchanged) user object from the reset check.
            // If 'updatedAt' was the only thing modified by the check, no DB write is needed just for that here.
            console.log(
                `[API Profile GET] No DB reset needed for user ${userId}. currentCaloriesToday: ${userAfterResetCheck.currentCaloriesToday}`
            )
            user = userAfterResetCheck
        }

        // 5. Determine the Next Unlockable Cat
        // Fetch all non-default cats from the database.
        const allUnlockableCats = await prisma.cat.findMany({
            where: { isDefault: false },
        })
        // Use the utility function to find the next cat the user can unlock.
        // Crucially, 'user' here is the most up-to-date version (with potentially reset daily calories).
        const nextUnlockCat = findNextUnlockableCat(user, allUnlockableCats)
        console.log(
            `[API Profile GET] Next unlockable cat for user ${userId}: ${
                nextUnlockCat ? nextUnlockCat.name : 'None available or all unlocked'
            }`
        )

        // 6. Prepare and Return Response
        // Exclude sensitive information (like the hashed password) from the user object.
        const { password: _, ...userWithoutPassword } = user

        // Return the user data (which includes activeCat and unlockedCats due to Prisma include)
        // and the information about the next cat to unlock.
        return NextResponse.json({ user: userWithoutPassword, nextUnlockCat }, { status: 200 })
    } catch (error: unknown) {
        // Catch as unknown for type safety
        let errorMessage = 'An unknown error occurred while fetching user profile.'
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
        console.error(
            `[API Profile GET] Failed to fetch or process user profile for ID ${userId}:`,
            error
        ) // Log the full error
        return NextResponse.json(
            { message: `Failed to load user profile: ${errorMessage}` },
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
        // Update the 'activeCatId' field and 'updatedAt' timestamp for the specific user.
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                activeCatId,
                updatedAt: new Date(), // Explicitly update 'updatedAt'
            },
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
    } catch (error: unknown) {
        // Catch as unknown
        let errorMessage = 'An unknown error occurred while updating user profile.'
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
        console.error(`[API Profile PUT] Failed to update user profile for ID ${userId}:`, error) // Log the full error
        return NextResponse.json(
            { message: `Failed to update user profile: ${errorMessage}` },
            { status: 500 }
        )
    }
}
