// app/(auth)/login/page.tsx
'use client'

import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import PixelInput from '../../../components/PixelInput'
import PixelButton from '../../../components/PixelButton'
import Link from 'next/link'

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const result = await signIn('credentials', {
            redirect: false,
            email,
            password,
            callbackUrl: '/', // Redirect to home page on success
        })

        setLoading(false)

        if (result?.error) {
            setError(result.error || 'Login failed. Please check your credentials.')
        } else if (result?.url) {
            router.push(result.url) // Manually push to the callback URL
        }
    }

    return (
        <div className="w-full">
            <h2 className="text-3xl text-center mb-6 text-pixel-dark">Login</h2>
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
                {error && <p className="text-pixel-red mb-4">{error}</p>}
                <PixelButton type="submit" disabled={loading} className="w-full">
                    {loading ? 'Logging in...' : 'Login'}
                </PixelButton>
                <p className="mt-4 text-pixel-dark">
                    Don't have an account?{' '}
                    <Link href="/register">
                        <span className="text-pixel-accent hover:underline cursor-pointer">
                            Register here
                        </span>
                    </Link>
                </p>
            </form>
        </div>
    )
}

export default LoginPage
