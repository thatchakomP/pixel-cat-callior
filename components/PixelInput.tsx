// components/PixelInput.tsx
'use client' // <-- ADD THIS

import React, { InputHTMLAttributes } from 'react'

interface PixelInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    id: string
}

const PixelInput: React.FC<PixelInputProps> = ({ label, id, className = '', ...props }) => {
    return (
        <div className="mb-4 w-full">
            {label && (
                <label htmlFor={id} className="block text-pixel-dark text-lg mb-1">
                    {label}
                </label>
            )}
            <input
                id={id}
                className={`w-full p-3 border-3 border-pixel-dark bg-pixel-bg shadow-pixel-inset-sm
                    focus:outline-none focus:ring-2 focus:ring-pixel-accent focus:shadow-pixel-md ${className}`}
                {...props}
            />
        </div>
    )
}

export default PixelInput
