// components/CatDisplay.tsx
'use client'

import React from 'react'
import Image from 'next/image' // Re-import Next.js Image component

interface CatDisplayProps {
    videoUrl: string // This prop can now be a video URL or a static image URL (if fallback)
    name?: string | null
}

const CatDisplay: React.FC<CatDisplayProps> = ({ videoUrl, name }) => {
    // Determine if the URL is for an image based on extension
    const isImage =
        videoUrl.endsWith('.png') ||
        videoUrl.endsWith('.jpg') ||
        videoUrl.endsWith('.jpeg') ||
        videoUrl.endsWith('.gif')

    return (
        <div className="relative w-full aspect-square bg-pixel-blue-frame border-3 border-pixel-blue-dark shadow-pixel-sm rounded-pixel-sm flex items-center justify-center overflow-hidden">
            {videoUrl ? (
                isImage ? ( // If it's an image URL (e.g., fallback static image)
                    <Image
                        src={videoUrl}
                        alt={name || 'Your virtual cat'}
                        fill // Fills the parent container
                        className="next-image-pixelated object-contain"
                        priority
                    />
                ) : (
                    // If it's a video URL (e.g., from Replicate)
                    <video
                        key={videoUrl} // Key to force re-render if URL changes
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
                            const mediaError = e.currentTarget.error
                            if (mediaError) {
                                let errorMsg = `Code: ${mediaError.code}`
                                switch (mediaError.code) {
                                    case mediaError.MEDIA_ERR_ABORTED:
                                        errorMsg += ' (User aborted playback)'
                                        break
                                    case mediaError.MEDIA_ERR_NETWORK:
                                        errorMsg += ' (Network error)'
                                        break
                                    case mediaError.MEDIA_ERR_DECODE:
                                        errorMsg += ' (Decode error)'
                                        break
                                    case mediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                                        errorMsg += ' (Source not supported)'
                                        break
                                    default:
                                        errorMsg += ' (Unknown media error)'
                                }
                                console.error(`Detailed Video Error (${videoUrl}): ${errorMsg}`)
                            }
                        }}
                    >
                        Your browser does not support the video tag or the video failed to load.
                    </video>
                )
            ) : (
                // Fallback for when videoUrl is not available (e.g., during generation or if it fails and no fallback URL is set)
                <div className="flex flex-col items-center justify-center text-pixel-blue-dark text-center p-4">
                    <p>Cat asset not available.</p>
                    <p className="text-sm">Generating new cat for you (or falling back)...</p>
                </div>
            )}

            {name && ( // Only display name if it's not null/undefined/empty
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-pixel-blue-dark text-pixel-blue-text px-3 py-1 text-sm border-2 border-pixel-blue-medium shadow-pixel-sm rounded-pixel-sm">
                    {name}
                </div>
            )}
        </div>
    )
}

export default CatDisplay
