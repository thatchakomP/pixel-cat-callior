// app/(auth)/register/page.tsx
'use client'

import React, { useState } from 'react' // Corrected import for React and useState
import { useRouter } from 'next/navigation' // Correct import for useRouter
import PixelInput from '../../../components/PixelInput'
import PixelButton from '../../../components/PixelButton'
import Link from 'next/link'

const RegisterPage: React.FC = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter() // useRouter hook should be called inside the component body

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        if (password !== confirmPassword) {
            setError('Passwords do not match.')
            setLoading(false)
            return
        }

        try {
            const res = await fetch('/api/user/register', {
                // Calls app/api/user/register/route.ts
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || 'Registration failed.')
            }

            // After successful registration, redirect to onboarding
            router.push('/onboarding')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full">
            <h2 className="text-3xl text-center mb-6 text-pixel-dark">Register</h2>
            <form onSubmit={handleSubmit} className="flex flex-col items-center">
                <PixelInput
                    id="email"
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <PixelInput
                    id="password"
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <PixelInput
                    id="confirmPassword"
                    label="Confirm Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                {error && <p className="text-pixel-red mb-4">{error}</p>}
                <PixelButton type="submit" disabled={loading} className="w-full">
                    {loading ? 'Registering...' : 'Register'}
                </PixelButton>
                <p className="mt-4 text-pixel-dark">
                    Already have an account?{' '}
                    <Link href="/login">
                        <span className="text-pixel-accent hover:underline cursor-pointer">
                            Login here
                        </span>
                    </Link>
                </p>
            </form>
        </div>
    )
}

export default RegisterPage
