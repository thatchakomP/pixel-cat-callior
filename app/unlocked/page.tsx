// app/unlocked/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import CatDisplay from '../../components/CatDisplay'
import PixelButton from '../../components/PixelButton'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useUserStore } from '../../store/userStore'
import { Cat } from '@prisma/client'

const UnlockedPage: React.FC = () => {
    const { data: session, status } = useSession()
    const router = useRouter()
    const { user, fetchUser, setActiveCat } = useUserStore()

    const [newlyUnlockedCat, setNewlyUnlockedCat] = useState<Cat | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        console.log('--- UnlockedPage useEffect START ---')
        console.log('  Session status:', status)
        console.log('  User from store:', user)
        console.log('  newlyUnlockedCat state (inside useEffect):', newlyUnlockedCat)
        console.log('---')

        if (status === 'unauthenticated') {
            console.log('  Status unauthenticated, redirecting to login.')
            router.push('/login')
            return
        }

        if (status === 'authenticated' && !user) {
            console.log('  Authenticated but user data not loaded. Fetching user...')
            fetchUser() // This triggers the API call to get user data
            return // Exit to avoid processing with null user
        }

        // Now 'user' should be available (if authenticated)
        if (user) {
            console.log('  User is available. Unlocked cats count:', user.unlockedCats?.length)
            if (user.unlockedCats && user.unlockedCats.length > 0) {
                const currentlyActiveCatId = user.activeCatId
                console.log('  Current active cat ID:', currentlyActiveCatId)

                // Logic to find the 'newest' unlocked cat that isn't already active
                // This prioritizes the most recently added cat if not already active
                let foundNewCat: Cat | null = null
                if (user.unlockedCats.length > 0) {
                    // Simplest: Just take the very last unlocked cat
                    const lastUnlocked = user.unlockedCats[user.unlockedCats.length - 1]
                    if (lastUnlocked && lastUnlocked.id !== currentlyActiveCatId) {
                        foundNewCat = lastUnlocked
                    } else if (
                        user.unlockedCats.length === 1 &&
                        user.activeCatId === lastUnlocked?.id
                    ) {
                        // Only one cat, and it's active. Nothing new to show.
                        foundNewCat = null
                    } else {
                        // More complex: Find a cat that was just added and isn't the active one.
                        // This is tricky without knowing the exact state change.
                        // For now, let's stick to the last added if it's different from active.
                        // Or, if all are active/no "new" distinct one, consider the last one.
                        if (
                            user.unlockedCats.length > 1 &&
                            user.unlockedCats[user.unlockedCats.length - 2]?.id ===
                                currentlyActiveCatId
                        ) {
                            foundNewCat = lastUnlocked // If second to last is active, then last one is new
                        } else if (lastUnlocked?.id === currentlyActiveCatId) {
                            // If the very last cat is the active one, no *new* one to display specifically here.
                            // This path implies we might not show a cat, but the user is still here.
                            // This is where redirecting to '/' if `foundNewCat` is null might be useful.
                            console.log(
                                '  Last unlocked cat is already active. No *new* cat to highlight on this page.'
                            )
                            foundNewCat = null
                        } else {
                            foundNewCat = lastUnlocked // Otherwise, assume the last one is the one we want to show
                        }
                    }
                }

                if (foundNewCat && (!newlyUnlockedCat || newlyUnlockedCat.id !== foundNewCat.id)) {
                    setNewlyUnlockedCat(foundNewCat)
                    console.log('  Set newlyUnlockedCat to:', foundNewCat.name || foundNewCat.id)
                } else if (!foundNewCat) {
                    console.log('  No distinct new cat found to display on UnlockedPage.')
                    // Option: Redirect to home if no new cat is found to prevent being stuck
                    // router.push('/');
                }
            } else {
                console.log('  User has no unlocked cats in the array. Cannot determine new cat.')
                // Option: Redirect to home if no cats are unlocked
                // router.push('/');
            }
        }
        console.log('--- UnlockedPage useEffect END ---')
    }, [status, router, user, fetchUser]) // Keep dependencies minimal and correct

    const handleApplyNewCat = async () => {
        console.log('--- handleApplyNewCat called ---')
        console.log('  Value of newlyUnlockedCat at button click:', newlyUnlockedCat)
        console.log('  Value of newlyUnlockedCat?.id at button click:', newlyUnlockedCat?.id)

        // Crucial validation: Ensure newlyUnlockedCat and its ID exist
        if (!newlyUnlockedCat || !newlyUnlockedCat.id) {
            console.error(
                '  ERROR: Attempted to apply new cat, but newlyUnlockedCat or its ID is missing.'
            )
            setError(
                'Cannot apply new cat: Cat data is missing. Please refresh the page or go back home.'
            )
            return
        }
        if (!session?.user?.id) {
            console.error('  ERROR: Attempted to apply new cat, but session ID is missing.')
            setError('User session is invalid. Please log in again.')
            return
        }

        console.log('  Attempting to set active cat to ID:', newlyUnlockedCat.id)
        setError(null) // Clear previous errors
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activeCatId: newlyUnlockedCat.id }), // Ensure ID is correctly passed
            })

            const data = await res.json()
            if (!res.ok) {
                console.error('  API response for setting active cat not OK:', res.status, data)
                throw new Error(data.message || `Failed to set active cat. Status: ${res.status}`)
            }
            setActiveCat(newlyUnlockedCat.id) // Update zustand store
            console.log('  Successfully set active cat, redirecting to home.')
            router.push('/')
        } catch (err: any) {
            console.error('  Error setting active cat:', err)
            setError(err.message || 'An unexpected error occurred while setting active cat.')
        } finally {
            console.log('--- handleApplyNewCat END ---')
        }
    }

    // Show spinner during session loading or while user data is being fetched
    if (status === 'loading' || (status === 'authenticated' && !user)) {
        console.log('UnlockedPage: Showing LoadingSpinner during initial session/user data load.')
        return <LoadingSpinner />
    }

    // If authenticated, user data loaded, but no new cat found (meaning all are active, or no distinct new one)
    if (status === 'authenticated' && user && !newlyUnlockedCat) {
        console.log(
            'UnlockedPage: Authenticated, user loaded, but no newly unlocked cat to display. Displaying fallback.'
        )
        return (
            <div className="w-full text-center text-pixel-dark">
                <h2 className="text-3xl mb-6">No New Cat To Display</h2>
                <p>It seems there's no new cat to show right now, or you've already applied it!</p>
                <PixelButton onClick={() => router.push('/')} className="mt-8">
                    Back to Home
                </PixelButton>
            </div>
        )
    }

    // If we reach here, it means status is 'authenticated', user is loaded, AND newlyUnlockedCat is set.
    console.log('UnlockedPage: Rendering main content with newly unlocked cat.')
    return (
        <div className="w-full text-center">
            <h2 className="text-3xl text-pixel-accent mb-6">Congratulations!</h2>
            <p className="text-2xl text-pixel-dark mb-8">You Unlocked a New Cat!</p>

            {error && <p className="text-pixel-red mb-4">{error}</p>}

            <div className="bg-pixel-dark pixel-border p-4 mb-8">
                <p className="text-pixel-bg text-xl mb-4">🎉 Amazing! 🎉</p>
                {newlyUnlockedCat && (
                    <CatDisplay
                        videoUrl={newlyUnlockedCat.videoUrl}
                        name={newlyUnlockedCat.name || 'New Friend'}
                    />
                )}
                <p className="text-pixel-bg text-xl mt-4">Meet your new companion!</p>
            </div>

            <PixelButton onClick={handleApplyNewCat} className="w-full">
                Apply New Cat to Home
            </PixelButton>
            <PixelButton
                variant="secondary"
                onClick={() => router.push('/')}
                className="w-full mt-4"
            >
                Back to Home (Keep current cat)
            </PixelButton>
        </div>
    )
}

export default UnlockedPage
