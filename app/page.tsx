// app/page.tsx
'use client'

import React, { useEffect, useState } from 'react' // Added useState
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

// Import UI components
import CatDisplay from '../components/CatDisplay'
import CalorieBar from '../components/CalorieBar'
import PixelButton from '../components/PixelButton'
import LoadingSpinner from '../components/LoadingSpinner'
import UpdateProfileModal from '../components/UpdateProfileModal' // Import the new modal component

// Import Zustand store for global user state management
import { useUserStore } from '../store/userStore'

const HomePage: React.FC = () => {
    // Get session data and status from NextAuth.js
    const { data: session, status } = useSession()

    // Get router instance for navigation
    const router = useRouter()

    // Get user data, loading state, and fetch/update actions from Zustand store
    const { user, isLoading: isUserStoreLoading, fetchUser } = useUserStore()

    // State to control the visibility of the UpdateProfileModal
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)

    // useEffect hook to handle side effects like data fetching and redirections
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
            <p className="text-pixel-blue-dark text-center">
                No cat found. Something went wrong or onboarding is incomplete.
            </p>
        )
    }

    // Main Dashboard Content
    return (
        <div className="w-full text-center">
            <h2 className="text-3xl text-pixel-blue-dark mb-4">Hello, {user.name || 'Trainer'}!</h2>

            <CatDisplay videoUrl={user.activeCat.videoUrl} name={user.activeCat.name} />

            <CalorieBar
                currentCalories={user.currentCaloriesToday}
                targetCalories={user.dailyCalorieTarget || 2000}
            />

            {/* Button to open the update profile modal */}
            <PixelButton
                variant="secondary"
                onClick={() => {
                    console.log('Opening update profile modal. Current user for modal:', user)
                    setIsUpdateModalOpen(true)
                }}
                className="w-full mt-2 mb-4"
            >
                Update My Stats
            </PixelButton>

            {/* Display the Next Unlock Goal information */}
            {user.nextUnlockCat && user.nextUnlockCat.unlockCriteria && (
                <div className="text-pixel-blue-dark text-lg mt-4 mb-6 bg-pixel-blue-medium pixel-border p-3">
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
                    </p>
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

            {/* Modal Component Rendering */}
            {isUpdateModalOpen &&
                user && ( // Only render if modal is open and user data is available
                    <UpdateProfileModal
                        isOpen={isUpdateModalOpen}
                        onClose={() => setIsUpdateModalOpen(false)}
                        currentUser={user} // Pass the current user data to the modal
                    />
                )}
        </div>
    )
}

export default HomePage
