// components/CatDisplay.tsx
'use client'

import React from 'react'
import Image from 'next/image' // Re-import Next.js Image component for GIFs/static images

interface CatDisplayProps {
    videoUrl: string // <--- EXPECTS videoUrl (can be a GIF or MP4 URL)
    name?: string | null
}

const CatDisplay: React.FC<CatDisplayProps> = ({ videoUrl, name }) => {
    // Determine if the URL is for a static image/GIF or a video based on extension
    const isStaticAsset =
        videoUrl.endsWith('.png') ||
        videoUrl.endsWith('.jpg') ||
        videoUrl.endsWith('.jpeg') ||
        videoUrl.endsWith('.gif')

    return (
        <div className="relative w-full aspect-square bg-pixel-blue-frame border-3 border-pixel-blue-dark shadow-pixel-sm rounded-pixel-sm flex items-center justify-center overflow-hidden">
            {videoUrl ? (
                isStaticAsset ? ( // If it's an image/GIF URL
                    <Image
                        key={videoUrl} // Add key to help React differentiate if URL changes
                        src={videoUrl}
                        alt={name || 'Your virtual cat'}
                        fill // Fills the parent container
                        className="next-image-pixelated object-contain"
                        priority // Load the main cat image/gif quickly
                        unoptimized={videoUrl.endsWith('.gif')} // Important for GIFs to animate correctly with next/image
                    />
                ) : (
                    // If it's a video URL (e.g., MP4 from Replicate)
                    <video
                        key={videoUrl}
                        src={videoUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                        crossOrigin="anonymous"
                        className="object-contain w-full h-full"
                        aria-label={name || 'Your virtual cat animation'}
                        onError={(e) => {
                            console.error('Video Error:', e.currentTarget.error || e)
                            // Further detailed error logging as before
                        }}
                    >
                        Your browser does not support the video tag or the video failed to load.
                    </video>
                )
            ) : (
                <div className="flex flex-col items-center justify-center text-pixel-blue-dark text-center p-4">
                    <p>Cat asset not available.</p>
                    <p className="text-sm">Generating new cat for you...</p>
                </div>
            )}

            {name && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-pixel-blue-dark text-pixel-blue-text px-3 py-1 text-sm border-2 border-pixel-blue-medium shadow-pixel-sm rounded-pixel-sm">
                    {name}
                </div>
            )}
        </div>
    )
}

export default CatDisplay
