// components/PixelButton.tsx
'use client' // <-- ADD THIS

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
            variantClasses = 'bg-pixel-accent text-pixel-dark hover:bg-pixel-medium'
            break
        case 'secondary':
            variantClasses = 'bg-pixel-medium text-pixel-bg hover:bg-pixel-dark'
            break
        case 'danger':
            variantClasses = 'bg-pixel-red text-white hover:bg-red-700'
            break
    }

    return (
        <button
            className={`px-6 py-3 border-3 border-pixel-dark shadow-pixel-sm
                  hover:shadow-pixel-md active:shadow-none active:translate-x-1 active:translate-y-1
                  transition-all duration-100 ${variantClasses} ${className}`}
            {...props}
        >
            {children}
        </button>
    )
}

export default PixelButton
