// components/UpdateProfileModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import PixelButton from './PixelButton'
import PixelInput from './PixelInput'
import { UserProfile, useUserStore } from '../store/userStore' // Assuming UserProfile type is exported

interface UpdateProfileModalProps {
    isOpen: boolean
    onClose: () => void
    currentUser: UserProfile // Pass current user data
}

const UpdateProfileModal: React.FC<UpdateProfileModalProps> = ({
    isOpen,
    onClose,
    currentUser,
}) => {
    const [weightKg, setWeightKg] = useState<string>(currentUser.weightKg?.toString() || '')
    const [goals, setGoals] = useState<string[]>(currentUser.goals || [])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const setUser = useUserStore((state) => state.setUser) // To update the store

    useEffect(() => {
        // Reset form when modal opens or currentUser changes
        setWeightKg(currentUser.weightKg?.toString() || '')
        setGoals(currentUser.goals || [])
        setError('')
        setSuccess('')
    }, [isOpen, currentUser])

    if (!isOpen) return null

    const handleGoalChange = (goal: string) => {
        setGoals((prevGoals) =>
            prevGoals.includes(goal) ? prevGoals.filter((g) => g !== goal) : [...prevGoals, goal]
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        if (!weightKg) {
            setError('Weight is required.')
            setLoading(false)
            return
        }

        try {
            const res = await fetch('/api/user/profile/update-stats', {
                // NEW API Endpoint
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    weightKg: parseFloat(weightKg),
                    goals,
                }),
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.message || 'Failed to update stats.')
            }

            setUser(data.user) // Update global store with new user data (including new BMI, calorie target)
            setSuccess('Profile updated successfully!')
            setTimeout(() => {
                onClose() // Close modal after a delay
            }, 1500)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-pixel-blue-frame pixel-border p-6 rounded-pixel-md w-full max-w-md text-pixel-blue-dark">
                <h3 className="text-2xl mb-4 text-center">Update Your Stats</h3>
                <form onSubmit={handleSubmit}>
                    <PixelInput
                        id="updateWeight"
                        label="Current Weight (kg)"
                        type="number"
                        step="0.1"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                        required
                    />

                    <div className="mb-4 w-full">
                        <label className="block text-pixel-blue-dark text-lg mb-2">
                            Update Your Goals:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                'be slimmer',
                                'be fatter',
                                'reduce carbohydrate',
                                'increase protein',
                                'maintain weight',
                            ].map((goal) => (
                                <label
                                    key={goal}
                                    className="flex items-center text-pixel-blue-dark"
                                >
                                    <input
                                        type="checkbox"
                                        checked={goals.includes(goal)}
                                        onChange={() => handleGoalChange(goal)}
                                        className="mr-2 h-5 w-5 border-2 border-pixel-blue-dark focus:ring-pixel-yellow checked:bg-pixel-green-success"
                                    />
                                    {goal}
                                </label>
                            ))}
                        </div>
                    </div>

                    {error && <p className="text-pixel-red-error mb-4">{error}</p>}
                    {success && <p className="text-pixel-green-success mb-4">{success}</p>}

                    <div className="flex justify-end gap-4 mt-6">
                        <PixelButton
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </PixelButton>
                        <PixelButton type="submit" variant="primary" disabled={loading}>
                            {loading ? 'Updating...' : 'Save Changes'}
                        </PixelButton>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default UpdateProfileModal
