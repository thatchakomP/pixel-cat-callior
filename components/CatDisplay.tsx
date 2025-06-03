// components/CatDisplay.tsx
'use client' // <-- ADD THIS

import React from 'react'
import Image from 'next/image'

interface CatDisplayProps {
    imageUrl: string
    name: string | null
}

const CatDisplay: React.FC<CatDisplayProps> = ({ imageUrl, name }) => {
    return (
        <div className="relative w-64 h-64 mx-auto mb-6 bg-pixel-medium pixel-border flex items-center justify-center overflow-hidden">
            <Image
                src={imageUrl}
                alt={name || 'Your virtual cat'}
                width={200} // Adjust based on your actual pixel art size
                height={200} // Adjust based on your actual pixel art size
                className="next-image-pixelated object-contain"
                priority // Load immediately on landing page
            />
            {name && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-pixel-dark text-pixel-bg px-3 py-1 text-sm border-2 border-pixel-bg shadow-pixel-sm">
                    {name}
                </div>
            )}
        </div>
    )
}

export default CatDisplay
