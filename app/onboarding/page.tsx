// app/onboarding/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import PixelInput from '../../components/PixelInput'
import PixelButton from '../../components/PixelButton'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useUserStore } from '../../store/userStore'

const OnboardingPage: React.FC = () => {
    const { data: session, status } = useSession() // status can be 'loading', 'authenticated', 'unauthenticated'
    const router = useRouter()
    const setUser = useUserStore((state) => state.setUser) // For updating user state after onboarding

    const [name, setName] = useState('')
    const [age, setAge] = useState('')
    const [gender, setGender] = useState('male')
    const [heightCm, setHeightCm] = useState('')
    const [weightKg, setWeightKg] = useState('')
    const [goals, setGoals] = useState<string[]>([])
    const [loading, setLoading] = useState(false) // Local loading state for form submission
    const [error, setError] = useState('')

    useEffect(() => {
        console.log('OnboardingPage useEffect - Session Status:', status)
        console.log('OnboardingPage useEffect - Local Form Loading State:', loading)
        console.log('OnboardingPage useEffect - Current session:', session)

        if (status === 'unauthenticated') {
            console.log('OnboardingPage: Session unauthenticated, redirecting to login.')
            router.push('/login')
        }
        // No explicit user data fetch here, as this page's purpose is to *create* the initial user data.
        // Once the form is submitted, it posts to /api/user/onboard, which then updates the user.
    }, [status, router, loading, session]) // Added 'session' to dependency array for full observation

    const handleGoalChange = (goal: string) => {
        setGoals((prevGoals) =>
            prevGoals.includes(goal) ? prevGoals.filter((g) => g !== goal) : [...prevGoals, goal]
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true) // Set local loading state to true
        setError('')

        if (!session?.user?.id) {
            setError('User not authenticated or session missing user ID.')
            setLoading(false)
            return
        }

        try {
            console.log('OnboardingPage: Submitting form data to /api/user/onboard...')
            const res = await fetch('/api/user/onboard', {
                // Calls app/api/user/onboard/route.ts
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: session.user.id,
                    name,
                    age: parseInt(age),
                    gender,
                    heightCm: parseInt(heightCm),
                    weightKg: parseFloat(weightKg),
                    goals,
                }),
            })

            const data = await res.json()
            if (!res.ok) {
                console.error('OnboardingPage: API response not OK.', res.status, data)
                throw new Error(data.message || `Onboarding failed with status: ${res.status}`)
            }

            setUser(data.user) // Update global user state with the newly created profile
            console.log('Onboarding successful, user data updated in store. Redirecting to home.')
            router.push('/') // Go to landing page
        } catch (err: any) {
            console.error('Onboarding submission error caught:', err)
            setError(err.message)
        } finally {
            setLoading(false) // Always set local loading state back to false
            console.log('OnboardingPage: Form submission process finished, setLoading(false).')
        }
    }

    // This condition determines whether to show the spinner or the form
    if (status === 'loading' || loading) {
        console.log(
            'OnboardingPage: Showing LoadingSpinner. Session status:',
            status,
            'Local loading:',
            loading
        )
        return <LoadingSpinner />
    }

    if (status === 'unauthenticated') {
        // This case is already handled by useEffect redirect, but for clarity
        console.log(
            "OnboardingPage: Rendering 'Redirecting to login...' (should be a brief flash)."
        )
        return <p className="text-pixel-dark">Redirecting to login...</p>
    }

    // If we reach here, it means status is 'authenticated' and local 'loading' is false.
    console.log('OnboardingPage: Rendering the onboarding form.')
    return (
        <div className="w-full">
            <h2 className="text-3xl text-center mb-6 text-pixel-dark">
                Welcome! Tell us about yourself.
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col items-center">
                <PixelInput
                    id="name"
                    label="Your Name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <PixelInput
                    id="age"
                    label="Age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                />
                <div className="mb-4 w-full">
                    <label className="block text-pixel-dark text-lg mb-1">Gender</label>
                    <select
                        id="gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full p-3 border-3 border-pixel-dark bg-pixel-bg shadow-pixel-inset-sm
                       focus:outline-none focus:ring-2 focus:ring-pixel-accent focus:shadow-pixel-md"
                        required
                    >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <PixelInput
                    id="height"
                    label="Height (cm)"
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    required
                />
                <PixelInput
                    id="weight"
                    label="Weight (kg)"
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    required
                />

                <div className="mb-4 w-full">
                    <label className="block text-pixel-dark text-lg mb-2">
                        What are your goals?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            'be slimmer',
                            'be fatter',
                            'reduce carbohydrate',
                            'increase protein',
                            'maintain weight',
                        ].map((goal) => (
                            <label key={goal} className="flex items-center text-pixel-dark">
                                <input
                                    type="checkbox"
                                    checked={goals.includes(goal)}
                                    onChange={() => handleGoalChange(goal)}
                                    className="mr-2 h-5 w-5 border-2 border-pixel-dark focus:ring-pixel-accent checked:bg-pixel-green"
                                />
                                {goal}
                            </label>
                        ))}
                    </div>
                </div>

                {error && <p className="text-pixel-red mb-4">{error}</p>}
                <PixelButton type="submit" disabled={loading} className="w-full">
                    {loading ? 'Generating Cat...' : 'Generate My Cat!'}
                </PixelButton>
            </form>
        </div>
    )
}

export default OnboardingPage
