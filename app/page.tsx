// app/page.tsx
'use client'

import React, { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import CatDisplay from '../components/CatDisplay'
import CalorieBar from '../components/CalorieBar'
import PixelButton from '../components/PixelButton'
import LoadingSpinner from '../components/LoadingSpinner'
import { useUserStore } from '../store/userStore'

const HomePage: React.FC = () => {
    const { data: session, status } = useSession()
    const router = useRouter()
    const { user, isLoading: isUserStoreLoading, fetchUser } = useUserStore()

    useEffect(() => {
        console.log('HomePage useEffect - Session status:', status)
        console.log('HomePage useEffect - User store user:', user)
        console.log('HomePage useEffect - User store isUserStoreLoading:', isUserStoreLoading)

        if (status === 'unauthenticated') {
            console.log('HomePage: Session unauthenticated, redirecting to login.')
            router.push('/login')
            return
        } else if (status === 'authenticated' && !user && !isUserStoreLoading) {
            console.log(
                'HomePage: Authenticated and user data not in store (and not loading). Initiating fetchUser().'
            )
            fetchUser()
        } else if (status === 'authenticated' && user && !user.activeCat) {
            console.log(
                'HomePage: Authenticated, user data loaded, but no active cat (not onboarded). Redirecting to onboarding.'
            )
            router.push('/onboarding')
            return
        } else if (status === 'authenticated' && user && user.activeCat) {
            console.log(
                'HomePage: Authenticated, user data loaded, and active cat found. Displaying content.'
            )
        }
    }, [status, router, user, isUserStoreLoading, fetchUser])

    if (status === 'loading' || isUserStoreLoading) {
        console.log(
            'HomePage: Currently showing LoadingSpinner. Session status:',
            status,
            'User store loading:',
            isUserStoreLoading
        )
        return <LoadingSpinner />
    }

    if (status === 'authenticated' && user && !user.activeCat) {
        console.log(
            'HomePage: Rendering fallback spinner for authenticated but not onboarded user (should redirect).'
        )
        return <LoadingSpinner />
    }

    if (!user || !user.activeCat) {
        console.log(
            'HomePage: Render fallback: user or activeCat is missing, but not in initial loading state.'
        )
        return (
            <p className="text-pixel-blue-text text-center">
                No cat found. Something went wrong or onboarding is incomplete.
            </p>
        ) // Adjusted text color
    }

    console.log('HomePage: Rendering main content with user and active cat.')
    return (
        <div className="w-full text-center">
            <h2 className="text-3xl text-pixel-blue-dark mb-4">Hello, {user.name || 'Trainer'}!</h2>{' '}
            {/* Adjusted text color */}
            <CatDisplay imageUrl={user.activeCat.imageUrl} name={user.activeCat.name} />
            <CalorieBar
                currentCalories={user.currentCaloriesToday}
                targetCalories={user.dailyCalorieTarget || 2000}
            />
            {user.nextUnlockCat && user.nextUnlockCat.unlockCriteria && (
                // Adjusted background and text colors
                <div className="text-pixel-blue-text text-lg mt-4 mb-6 bg-pixel-blue-medium pixel-border p-3">
                    <p className="font-bold mb-1">Next Unlock Goal:</p>
                    {(user.nextUnlockCat.unlockCriteria as any).totalCalories && (
                        <p>
                            Reach{' '}
                            <span className="text-pixel-yellow">
                                {(user.nextUnlockCat.unlockCriteria as any).totalCalories}
                            </span>{' '}
                            Lifetime Calories
                        </p>
                    )}
                    {(user.nextUnlockCat.unlockCriteria as any).goalMatch && (
                        <p>
                            Complete Goals:{' '}
                            <span className="text-pixel-yellow">
                                {(user.nextUnlockCat.unlockCriteria as any).goalMatch.join(', ')}
                            </span>
                        </p>
                    )}
                    {(user.nextUnlockCat.unlockCriteria as any).bmiTarget && (
                        <p>
                            Achieve BMI:{' '}
                            <span className="text-pixel-yellow">
                                {(user.nextUnlockCat.unlockCriteria as any).bmiTarget}
                            </span>
                        </p>
                    )}
                    <p className="text-sm text-pixel-blue-frame mt-2">
                        To unlock: "{user.nextUnlockCat.name}"
                    </p>{' '}
                    {/* Adjusted text color */}
                </div>
            )}
            <PixelButton onClick={() => router.push('/upload')} className="w-full">
                Upload Food Photo
            </PixelButton>
            {user.unlockedCats.length > 1 && (
                <PixelButton
                    variant="secondary"
                    onClick={() => router.push('/collection')}
                    className="w-full mt-4"
                >
                    My Cat Collection
                </PixelButton>
            )}
        </div>
    )
}

export default HomePage
