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
    const { data: session, status } = useSession()
    const router = useRouter()
    const setUser = useUserStore((state) => state.setUser)

    const [name, setName] = useState('')
    const [age, setAge] = useState('')
    const [gender, setGender] = useState('male')
    const [heightCm, setHeightCm] = useState('')
    const [weightKg, setWeightKg] = useState('')
    const [goals, setGoals] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        console.log('OnboardingPage useEffect - Session Status:', status)
        console.log('OnboardingPage useEffect - Local Form Loading State:', loading)
        console.log('OnboardingPage useEffect - Current session:', session)

        if (status === 'unauthenticated') {
            console.log('OnboardingPage: Session unauthenticated, redirecting to login.')
            router.push('/login')
        }
    }, [status, router, loading, session])

    const handleGoalChange = (goal: string) => {
        setGoals((prevGoals) =>
            prevGoals.includes(goal) ? prevGoals.filter((g) => g !== goal) : [...prevGoals, goal]
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        if (!session?.user?.id) {
            setError('User not authenticated.')
            setLoading(false)
            return
        }

        try {
            console.log('OnboardingPage: Submitting form data to /api/user/onboard...')
            const res = await fetch('/api/user/onboard', {
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

            setUser(data.user)
            console.log('Onboarding successful, user data updated in store. Redirecting to home.')
            router.push('/')
        } catch (err: any) {
            console.error('Onboarding submission error caught:', err)
            setError(err.message)
        } finally {
            setLoading(false)
            console.log('OnboardingPage: Form submission process finished, setLoading(false).')
        }
    }

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
        return <p className="text-pixel-blue-dark">Redirecting to login...</p>
        {
            /* Adjusted text color */
        }
    }

    return (
        <div className="w-full">
            <h2 className="text-3xl text-center mb-6 text-pixel-blue-dark">
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
                    <label className="block text-pixel-blue-dark text-lg mb-1">Gender</label>{' '}
                    {/* Adjusted text color */}
                    <select
                        id="gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full p-3 border-3 border-pixel-blue-medium bg-pixel-blue-frame shadow-pixel-inset-sm
                       focus:outline-none focus:ring-2 focus:ring-pixel-yellow focus:shadow-pixel-md
                       text-pixel-blue-dark" /* Adjusted text color */
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
                    <label className="block text-pixel-blue-dark text-lg mb-2">
                        What are your goals?
                    </label>{' '}
                    {/* Adjusted text color */}
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            'be slimmer',
                            'be fatter',
                            'reduce carbohydrate',
                            'increase protein',
                            'maintain weight',
                        ].map((goal) => (
                            <label key={goal} className="flex items-center text-pixel-blue-dark">
                                {' '}
                                {/* Adjusted text color */}
                                <input
                                    type="checkbox"
                                    checked={goals.includes(goal)}
                                    onChange={() => handleGoalChange(goal)}
                                    className="mr-2 h-5 w-5 border-2 border-pixel-blue-dark focus:ring-pixel-yellow checked:bg-pixel-green-success" /* Adjusted colors */
                                />
                                {goal}
                            </label>
                        ))}
                    </div>
                </div>
                {error && <p className="text-pixel-red-error mb-4">{error}</p>}{' '}
                {/* Adjusted text color */}
                <PixelButton type="submit" disabled={loading} className="w-full">
                    {loading ? 'Generating Cat...' : 'Generate My Cat!'}
                </PixelButton>
            </form>
        </div>
    )
}

export default OnboardingPage
