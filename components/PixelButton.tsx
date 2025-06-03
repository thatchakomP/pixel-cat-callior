// components/PixelButton.tsx
'use client'

import React, { ButtonHTMLAttributes } from 'react'

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode
    variant?: 'primary' | 'secondary' | 'danger'
}

const PixelButton: React.FC<PixelButtonProps> = ({
    children,
    variant = 'primary',
    className = '',
    ...props
}) => {
    let variantClasses = ''
    switch (variant) {
        case 'primary':
            variantClasses = 'bg-pixel-yellow text-pixel-blue-dark hover:bg-yellow-500' // Adjusted
            break
        case 'secondary':
            variantClasses = 'bg-pixel-blue-medium text-pixel-blue-text hover:bg-pixel-blue-dark' // Adjusted
            break
        case 'danger':
            variantClasses = 'bg-pixel-red-error text-pixel-blue-text hover:bg-red-600' // Adjusted
            break
    }

    return (
        <button
            className={`px-6 py-3 border-3 border-pixel-blue-medium shadow-pixel-sm
                  hover:shadow-pixel-md active:shadow-none active:translate-x-1 active:translate-y-1
                  transition-all duration-100 ${variantClasses} ${className}`}
            {...props}
        >
            {children}
        </button>
    )
}

export default PixelButton
