// app/(auth)/layout.tsx
import React from 'react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <h1 className="text-center text-4xl text-pixel-dark mb-6">
                <span className="cursor-pointer">Pixel Cat Callior</span>
            </h1>
            <div className="w-full max-w-sm bg-pixel-light pixel-border p-6">{children}</div>
        </div>
    )
}
