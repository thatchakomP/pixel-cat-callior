// components/CalorieBar.tsx
'use client' // <-- ADD THIS

import React from 'react'

interface CalorieBarProps {
    currentCalories: number
    targetCalories: number
}

const CalorieBar: React.FC<CalorieBarProps> = ({ currentCalories, targetCalories }) => {
    const percentage =
        targetCalories > 0 ? Math.min(100, (currentCalories / targetCalories) * 100) : 0

    return (
        <div className="w-full mb-6">
            <div className="text-center text-lg mb-2">
                <span className="text-pixel-accent">{currentCalories}</span> / {targetCalories}{' '}
                Calories Today
            </div>
            <div className="w-full h-8 bg-pixel-dark border-3 border-pixel-dark shadow-pixel-sm overflow-hidden relative">
                <div
                    className="h-full bg-pixel-green transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center text-pixel-bg text-sm">
                    {percentage.toFixed(0)}% Done
                </div>
            </div>
        </div>
    )
}

export default CalorieBar
