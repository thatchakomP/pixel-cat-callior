// app/collection/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import CatDisplay from '../../components/CatDisplay'
import PixelButton from '../../components/PixelButton'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useUserStore } from '../../store/userStore'
import { Cat } from '@prisma/client'

const CollectionPage: React.FC = () => {
    const { data: session, status } = useSession()
    const router = useRouter()
    const { user, isLoading, fetchUser, setActiveCat } = useUserStore()
    const [settingActive, setSettingActive] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        console.log('CollectionPage useEffect - Session status:', status)
        console.log('CollectionPage useEffect - User store user:', user)
        console.log('CollectionPage useEffect - User store isLoading:', isLoading)

        if (status === 'unauthenticated') {
            console.log('CollectionPage: Session unauthenticated, redirecting to login.')
            router.push('/login')
        } else if (status === 'authenticated' && !user && !isLoading) {
            console.log(
                'CollectionPage: Authenticated but user data not in store, initiating fetchUser.'
            )
            fetchUser()
        }
    }, [status, router, user, isLoading, fetchUser])

    const handleSetActive = async (catId: string) => {
        if (!session?.user?.id || !user) {
            setError('User not authenticated or data missing.')
            return
        }
        if (user.activeCatId === catId) {
            console.log('CollectionPage: Cat is already active, no change needed.')
            return
        }

        setSettingActive(true)
        setError(null)
        try {
            console.log(`CollectionPage: Attempting to set active cat to ID: ${catId}`)
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activeCatId: catId }),
            })

            const data = await res.json()
            if (!res.ok) {
                console.error(
                    'CollectionPage: API response for setting active cat not OK:',
                    res.status,
                    data
                )
                throw new Error(data.message || 'Failed to set active cat.')
            }
            setActiveCat(catId)
            console.log(
                `CollectionPage: Successfully set active cat to ${catId}, redirecting to home.`
            )
            router.push('/')
        } catch (err: any) {
            console.error('CollectionPage: Error setting active cat:', err)
            setError(err.message || 'An unexpected error occurred while setting active cat.')
        } finally {
            setSettingActive(false)
        }
    }

    if (status === 'loading' || isLoading) {
        console.log('CollectionPage: Showing LoadingSpinner during initial session/user data load.')
        return <LoadingSpinner />
    }

    if (!user || !user.unlockedCats || user.unlockedCats.length === 0) {
        console.log('CollectionPage: User has no unlocked cats to display. Displaying fallback.')
        return (
            <div className="w-full text-center text-pixel-blue-dark">
                <h2 className="text-3xl mb-6">Your Cat Collection</h2>
                <p>You haven't unlocked any cats yet! Upload food to earn EXP.</p>
                <PixelButton onClick={() => router.push('/upload')} className="mt-8">
                    Upload Food
                </PixelButton>
            </div>
        )
    }

    console.log('CollectionPage: Rendering cat collection with unlocked cats.')
    return (
        <div className="w-full text-center">
            <h2 className="text-3xl text-pixel-blue-dark mb-4">Your Cat Collection</h2>
            <p className="text-pixel-blue-dark mb-8">
                Click on a cat to make it your active companion!
            </p>

            {error && <p className="text-pixel-red-error mb-4">{error}</p>}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-4">
                {user.unlockedCats.map((cat) => (
                    <div
                        key={cat.id}
                        className={`pixel-border p-2 bg-pixel-blue-frame cursor-pointer transition-transform duration-200 ease-out
                        ${
                            user.activeCatId === cat.id
                                ? 'border-pixel-yellow scale-105 shadow-pixel-md'
                                : 'border-pixel-blue-medium hover:scale-105'
                        }
                        relative flex flex-col items-center justify-center`}
                        onClick={() => handleSetActive(cat.id)}
                    >
                        {/* --- CHANGED: Pass videoUrl to CatDisplay --- */}
                        <CatDisplay videoUrl={cat.videoUrl} name={cat.name} />

                        {/* Active/Setting Label */}
                        {user.activeCatId === cat.id && (
                            <p className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-pixel-yellow text-pixel-blue-dark px-2 py-0.5 text-sm font-bold rounded-pixel-sm shadow-pixel-sm">
                                ACTIVE
                            </p>
                        )}
                        {settingActive && user.activeCatId !== cat.id && (
                            <p className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-pixel-blue-light text-pixel-blue-dark px-2 py-0.5 text-sm font-bold rounded-pixel-sm shadow-pixel-sm">
                                SETTING...
                            </p>
                        )}
                    </div>
                ))}
            </div>

            <PixelButton
                variant="secondary"
                onClick={() => router.push('/')}
                className="w-full mt-8"
            >
                Back to Home
            </PixelButton>
        </div>
    )
}

export default CollectionPage
