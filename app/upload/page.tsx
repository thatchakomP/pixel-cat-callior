// app/upload/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import PixelButton from '../../components/PixelButton'
import LoadingSpinner from '../../components/LoadingSpinner'
import Image from 'next/image'
import { useUserStore } from '../../store/userStore'
import { FoodLogEntry } from '@prisma/client'

const UploadPage: React.FC = () => {
    const { data: session, status } = useSession()
    const router = useRouter()
    const { user, updateUserCalories, unlockNewCat } = useUserStore()

    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [analysisResult, setAnalysisResult] = useState<FoodLogEntry | null>(null)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        }
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl)
            }
        }
    }, [status, router, previewUrl])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setSelectedFile(file)
            if (previewUrl) URL.revokeObjectURL(previewUrl)
            setPreviewUrl(URL.createObjectURL(file))
            setAnalysisResult(null)
            setError('')
        }
    }

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select an image first.')
            return
        }
        if (!session?.user?.id) {
            setError('User not authenticated. Please log in again.')
            return
        }

        setLoading(true)
        setError('')

        const formData = new FormData()
        formData.append('foodImage', selectedFile)
        formData.append('userId', session.user.id)

        try {
            const res = await fetch('/api/food/upload', {
                method: 'POST',
                body: formData,
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.message || 'Food analysis failed.')
            }

            setAnalysisResult(data.foodLog)
            updateUserCalories(data.foodLog.totalCalories)

            if (data.unlockedCats && data.unlockedCats.length > 0) {
                data.unlockedCats.forEach((cat: any) => unlockNewCat(cat))
                router.push('/unlocked')
            }
        } catch (err: any) {
            console.error('Upload error:', err)
            setError(err.message || 'An unexpected error occurred during upload.')
        } finally {
            setLoading(false)
            setSelectedFile(null)
            if (previewUrl) URL.revokeObjectURL(previewUrl)
            setPreviewUrl(null)
        }
    }

    if (status === 'loading') {
        return <LoadingSpinner />
    }

    return (
        <div className="w-full text-center">
            <h2 className="text-3xl text-pixel-blue-dark mb-6">Upload Your Food</h2>

            <div className="mb-6">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="food-upload-input"
                />
                <label
                    htmlFor="food-upload-input"
                    className="block w-full h-48 border-3 border-dashed border-pixel-blue-medium bg-pixel-blue-medium 
                     flex items-center justify-center text-pixel-blue-text text-xl cursor-pointer 
                     hover:bg-pixel-blue-dark transition-colors duration-200 rounded-pixel-sm"
                >
                    {previewUrl ? (
                        <Image
                            src={previewUrl}
                            alt="Food preview"
                            width={200}
                            height={180}
                            className="object-contain next-image-pixelated max-h-full max-w-full"
                        />
                    ) : (
                        <span>Tap to select image</span>
                    )}
                </label>
            </div>

            {error && <p className="text-pixel-red-error mb-4">{error}</p>}

            <PixelButton
                onClick={handleUpload}
                disabled={!selectedFile || loading}
                className="w-full"
            >
                {loading ? 'Analyzing Food...' : 'Confirm & Analyze'}
            </PixelButton>

            {loading && <LoadingSpinner />}

            {analysisResult && (
                <div className="mt-8 bg-pixel-blue-medium pixel-border p-4 text-left">
                    <h3 className="text-2xl text-pixel-blue-text mb-4">Analysis Results:</h3>
                    {(analysisResult.detectedFoods as any[]).length > 0 ? (
                        <ul>
                            {(analysisResult.detectedFoods as any[]).map(
                                (food: any, index: number) => (
                                    <li key={index} className="text-pixel-blue-text mb-2">
                                        <span className="font-bold">{food.name}:</span>{' '}
                                        {food.calories} kcal (P:{food.protein}g, C:{food.carbs}g, F:
                                        {food.fat}g)
                                    </li>
                                )
                            )}
                        </ul>
                    ) : (
                        <p className="text-pixel-blue-text">
                            No specific food items detected. Total calories below.
                        </p>
                    )}
                    <p className="text-pixel-blue-text font-bold text-xl mt-4">
                        Total Calories:{' '}
                        <span className="text-pixel-yellow">
                            {analysisResult.totalCalories} kcal
                        </span>
                    </p>
                    <PixelButton onClick={() => router.push('/')} className="w-full mt-4">
                        Back to Home
                    </PixelButton>
                </div>
            )}
        </div>
    )
}

export default UploadPage
