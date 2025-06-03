// app/page.tsx
'use client' // This directive marks the component as a Client Component

import React, { useEffect } from 'react'
import { useSession } from 'next-auth/react' // For authentication status
import { useRouter } from 'next/navigation' // For client-side navigation in App Router

// Import UI components
import CatDisplay from '../components/CatDisplay'
import CalorieBar from '../components/CalorieBar'
import PixelButton from '../components/PixelButton'
import LoadingSpinner from '../components/LoadingSpinner'

// Import Zustand store for global user state management
import { useUserStore } from '../store/userStore'

const HomePage: React.FC = () => {
    // Get session data and status from NextAuth.js
    const { data: session, status } = useSession() // 'status' can be 'loading', 'authenticated', 'unauthenticated'

    // Get router instance for navigation
    const router = useRouter()

    // Get user data, loading state, and fetch/update actions from Zustand store
    // Renamed isLoading from useUserStore to isUserStoreLoading to avoid conflict/confusion with NextAuth's 'status'
    const { user, isLoading: isUserStoreLoading, fetchUser } = useUserStore()

    // useEffect hook to handle side effects like data fetching and redirections
    useEffect(() => {
        // --- Debugging Logs ---
        console.log('HomePage useEffect - Session status:', status)
        console.log('HomePage useEffect - User store user:', user)
        console.log('HomePage useEffect - User store isUserStoreLoading:', isUserStoreLoading)
        // --- End Debugging Logs ---

        // Scenario 1: User is not authenticated
        if (status === 'unauthenticated') {
            console.log('HomePage: Session unauthenticated, redirecting to login.')
            router.push('/login')
            return // Exit to prevent further rendering logic until redirected
        }
        // Scenario 2: User is authenticated but their profile data is not yet loaded in Zustand store
        // This happens immediately after login, or if the user data in the store is stale/missing.
        else if (status === 'authenticated' && !user && !isUserStoreLoading) {
            console.log(
                'HomePage: Authenticated and user data not in store (and not loading). Initiating fetchUser().'
            )
            fetchUser() // This triggers the GET /api/user/profile call to load user data
            // No return here, as the component will re-render and the spinner will display due to `isUserStoreLoading` becoming true.
        }
        // Scenario 3: User is authenticated, profile data is loaded, but they haven't completed onboarding (no active cat)
        else if (status === 'authenticated' && user && !user.activeCat) {
            console.log(
                'HomePage: Authenticated, user data loaded, but no active cat (not onboarded). Redirecting to onboarding.'
            )
            router.push('/onboarding')
            return // Exit to prevent further rendering logic until redirected
        }
        // Scenario 4: User is authenticated, profile data is loaded, and they have an active cat (fully onboarded)
        else if (status === 'authenticated' && user && user.activeCat) {
            console.log(
                'HomePage: Authenticated, user data loaded, and active cat found. Displaying content.'
            )
            // The component will now proceed to render the main dashboard content.
            // No redirection needed here.
        }
        // Note: If status is 'loading' (from useSession), the component will render LoadingSpinner based on the return statement below.
    }, [status, router, user, isUserStoreLoading, fetchUser]) // Dependencies for useEffect

    // --- Render Logic Based on States ---

    // Display a loading spinner if NextAuth session is loading OR if user profile data is being fetched
    if (status === 'loading' || isUserStoreLoading) {
        console.log(
            'HomePage: Currently showing LoadingSpinner. Session status:',
            status,
            'User store loading:',
            isUserStoreLoading
        )
        return <LoadingSpinner />
    }

    // Fallback for cases where session is authenticated but user is null after fetch attempts,
    // or user exists but without activeCat (should ideally redirect to onboarding via useEffect)
    if (status === 'authenticated' && user && !user.activeCat) {
        console.log(
            'HomePage: Rendering fallback spinner for authenticated but not onboarded user (should have redirected).'
        )
        return <LoadingSpinner />
    }

    // This is a final safeguard. If we reach here and 'user' or 'user.activeCat' is missing,
    // it implies an unexpected state or a deeper data fetching issue.
    if (!user || !user.activeCat) {
        console.log(
            'HomePage: Render fallback: user or activeCat is missing, but not in initial loading state.'
        )
        return (
            <p className="text-pixel-dark text-center">
                No cat found. Something went wrong or onboarding is incomplete.
            </p>
        )
    }

    // --- Main Dashboard Content (rendered when user is fully authenticated and onboarded) ---
    console.log('HomePage: Rendering main content with user and active cat.')
    return (
        <div className="w-full text-center">
            <h2 className="text-3xl text-pixel-dark mb-4">Hello, {user.name || 'Trainer'}!</h2>

            {/* Display the user's active pixel art cat */}
            <CatDisplay imageUrl={user.activeCat.imageUrl} name={user.activeCat.name} />

            {/* Display the calorie progress bar */}
            <CalorieBar
                currentCalories={user.currentCaloriesToday}
                targetCalories={user.dailyCalorieTarget || 2000} // Use calculated target, fallback to 2000
            />

            {/* Display the Next Unlock Goal information */}
            {user.nextUnlockCat && user.nextUnlockCat.unlockCriteria && (
                <div className="text-pixel-dark text-lg mt-4 mb-6 bg-pixel-bg pixel-border p-3">
                    <p className="font-bold mb-1">Next Unlock Goal:</p>
                    {(user.nextUnlockCat.unlockCriteria as any).totalCalories && (
                        <p>
                            Reach{' '}
                            <span className="text-pixel-accent">
                                {(user.nextUnlockCat.unlockCriteria as any).totalCalories}
                            </span>{' '}
                            Lifetime Calories
                        </p>
                    )}
                    {(user.nextUnlockCat.unlockCriteria as any).goalMatch && (
                        <p>
                            Complete Goals:{' '}
                            <span className="text-pixel-accent">
                                {(user.nextUnlockCat.unlockCriteria as any).goalMatch.join(', ')}
                            </span>
                        </p>
                    )}
                    {(user.nextUnlockCat.unlockCriteria as any).bmiTarget && (
                        <p>
                            Achieve BMI:{' '}
                            <span className="text-pixel-accent">
                                {(user.nextUnlockCat.unlockCriteria as any).bmiTarget}
                            </span>
                        </p>
                    )}
                    <p className="text-sm text-pixel-medium mt-2">
                        To unlock: "{user.nextUnlockCat.name}"
                    </p>
                </div>
            )}

            {/* Buttons for navigation */}
            <PixelButton onClick={() => router.push('/upload')} className="w-full">
                Upload Food Photo
            </PixelButton>

            {user.unlockedCats.length > 1 && ( // Only show collection button if more than 1 cat unlocked (including default)
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
