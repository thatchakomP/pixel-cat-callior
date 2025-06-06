// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

import prisma from '../../../../lib/prisma'
import { resetDailyCaloriesIfNewDay, findNextUnlockableCat } from '../../../../lib/utils'

const secret = process.env.NEXTAUTH_SECRET

export async function GET(request: NextRequest) {
    const token = await getToken({ req: request, secret: secret })
    if (!token || !token.id) {
        console.warn('[API Profile GET] Authentication failed: No token or token.id found.')
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const userId = token.id as string

    try {
        let user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                activeCat: true, // Cat model here now has videoUrl
                unlockedCats: true, // Cat model here now has videoUrl
            },
        })

        if (!user) {
            console.warn(`[API Profile GET] User not found in DB for ID: ${userId}`)
            return NextResponse.json({ message: 'User not found.' }, { status: 404 })
        }

        const userBeforeResetCheck = { ...user }
        const userAfterResetCheck = resetDailyCaloriesIfNewDay(user)

        if (
            userAfterResetCheck.currentCaloriesToday === 0 &&
            userBeforeResetCheck.currentCaloriesToday > 0
        ) {
            console.log(`[API Profile GET] Daily calories reset for user ${userId}. Updating DB.`)
            user = await prisma.user.update({
                where: { id: userId },
                data: { currentCaloriesToday: 0 },
                include: { activeCat: true, unlockedCats: true },
            })
            console.log(
                `[API Profile GET] DB reset complete for user ${userId}. currentCaloriesToday now: ${user.currentCaloriesToday}`
            )
        } else {
            console.log(
                `[API Profile GET] No DB reset needed for user ${userId}. currentCaloriesToday: ${user.currentCaloriesToday}`
            )
            user = userAfterResetCheck
        }

        const allUnlockableCats = await prisma.cat.findMany({
            where: { isDefault: false },
        })
        const nextUnlockCat = findNextUnlockableCat(user, allUnlockableCats)
        console.log(
            `[API Profile GET] Next unlockable cat for user ${userId}: ${
                nextUnlockCat ? nextUnlockCat.name : 'None available or all unlocked'
            }`
        )

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

export async function PUT(request: NextRequest) {
    const token = await getToken({ req: request, secret: secret })
    if (!token || !token.id) {
        console.warn('[API Profile PUT] Not authenticated: No token or token.id found.')
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const userId = token.id as string
    const { activeCatId } = await request.json()

    if (!activeCatId) {
        console.warn(`[API Profile PUT] Missing activeCatId in request for user ID: ${userId}`)
        return NextResponse.json({ message: 'activeCatId is required.' }, { status: 400 })
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { activeCatId },
            include: {
                activeCat: true, // Cat model here now has videoUrl
                unlockedCats: true, // Cat model here now has videoUrl
            },
        })

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
