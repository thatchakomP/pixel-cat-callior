// app/api/user/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma' // Adjust path
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json(
                { message: 'Email and password are required.' },
                { status: 400 }
            )
        }

        const existingUser = await prisma.user.findUnique({ where: { email } })
        if (existingUser) {
            return NextResponse.json(
                { message: 'User with this email already exists.' },
                { status: 409 }
            )
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                currentCaloriesToday: 0,
                totalLifetimeCalories: 0,
                goals: [],
            },
        })

        const { password: _, ...userWithoutPassword } = user // Exclude password from response
        return NextResponse.json(
            { message: 'User registered successfully.', user: userWithoutPassword },
            { status: 201 }
        )
    } catch (error) {
        console.error('Registration error:', error)
        return NextResponse.json(
            { message: 'Something went wrong during registration.' },
            { status: 500 }
        )
    }
}
