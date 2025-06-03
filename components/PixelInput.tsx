// components/PixelInput.tsx
'use client'

import React, { InputHTMLAttributes } from 'react'

interface PixelInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    id: string
}

const PixelInput: React.FC<PixelInputProps> = ({ label, id, className = '', ...props }) => {
    return (
        <div className="mb-4 w-full">
            {label && (
                // Apply text-pixel-blue-dark directly to the label
                <label htmlFor={id} className="block text-pixel-blue-dark text-lg mb-1">
                    {' '}
                    {/* <--- CHANGED THIS */}
                    {label}
                </label>
            )}
            <input
                id={id}
                className={`w-full p-3 border-3 border-pixel-blue-medium bg-pixel-blue-frame shadow-pixel-inset-sm
                    focus:outline-none focus:ring-2 focus:ring-pixel-yellow focus:shadow-pixel-md
                    text-pixel-blue-dark ${className}`} /* Also ensure input text itself is dark */
                {...props}
            />
        </div>
    )
}

export default PixelInput
