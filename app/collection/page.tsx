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

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        } else if (status === 'authenticated' && !user) {
            fetchUser()
        }
    }, [status, router, user, fetchUser])

    const handleSetActive = async (catId: string) => {
        if (!session?.user?.id || !user) return
        setSettingActive(true)
        try {
            const res = await fetch('/api/user/profile', {
                // Calls app/api/user/profile/route.ts
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activeCatId: catId }),
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.message || 'Failed to set active cat.')
            }
            setActiveCat(catId) // Update zustand store
            router.push('/') // Go back to home after setting
        } catch (error) {
            console.error('Error setting active cat:', error)
            // Display error to user
        } finally {
            setSettingActive(false)
        }
    }

    if (status === 'loading' || isLoading) {
        return <LoadingSpinner />
    }

    if (!user || user.unlockedCats.length === 0) {
        return (
            <div className="w-full text-center text-pixel-dark">
                <h2 className="text-3xl mb-6">Your Cat Collection</h2>
                <p>You haven't unlocked any cats yet! Upload food to earn EXP.</p>
                <PixelButton onClick={() => router.push('/upload')} className="mt-8">
                    Upload Food
                </PixelButton>
            </div>
        )
    }

    return (
        <div className="w-full text-center">
            <h2 className="text-3xl text-pixel-dark mb-6">Your Cat Collection</h2>
            <p className="text-pixel-dark mb-8">Click on a cat to make it your active companion!</p>

            <div className="grid grid-cols-2 gap-4">
                {user.unlockedCats.map((cat) => (
                    <div
                        key={cat.id}
                        className={`pixel-border p-2 bg-pixel-medium cursor-pointer transition-transform duration-200 ease-out
                        ${
                            user.activeCatId === cat.id
                                ? 'border-pixel-accent scale-105 shadow-pixel-md'
                                : 'hover:scale-105'
                        }`}
                        onClick={() => handleSetActive(cat.id)}
                    >
                        <CatDisplay imageUrl={cat.imageUrl} name={cat.name} />
                        {user.activeCatId === cat.id && (
                            <p className="text-pixel-accent text-sm mt-2">ACTIVE</p>
                        )}
                        {settingActive && user.activeCatId !== cat.id && (
                            <p className="text-pixel-bg text-sm mt-2">Setting...</p>
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
