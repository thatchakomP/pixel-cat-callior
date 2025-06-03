// components/CatDisplay.tsx
'use client'

import React from 'react'
import Image from 'next/image'

interface CatDisplayProps {
    imageUrl: string
    name?: string | null
}

const CatDisplay: React.FC<CatDisplayProps> = ({ imageUrl, name }) => {
    return (
        // Removed fixed w-64 h-64. Now use 'flex-grow' and 'aspect-square' or fixed width/height for the image.
        // Let the parent grid cell define its size.
        // Added 'aspect-square' to ensure it maintains a 1:1 ratio.
        <div className="relative w-full aspect-square bg-pixel-blue-frame border-3 border-pixel-blue-dark shadow-pixel-sm rounded-pixel-sm flex items-center justify-center overflow-hidden">
            <Image
                src={imageUrl}
                alt={name || 'Your virtual cat'}
                // Changed width/height to 'fill' for responsive image sizing within the parent container
                // and 'object-contain' to ensure the image scales down without cropping.
                fill // Fills the parent container (div)
                className="next-image-pixelated object-contain"
                priority
            />
            {name && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-pixel-blue-dark text-pixel-blue-text px-3 py-1 text-sm border-2 border-pixel-blue-medium shadow-pixel-sm rounded-pixel-sm">
                    {name}
                </div>
            )}
        </div>
    )
}

export default CatDisplay
