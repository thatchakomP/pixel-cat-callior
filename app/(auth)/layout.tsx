// app/(auth)/layout.tsx
import React from 'react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-pixel-blue-dark text-pixel-blue-dark">
            <h1 className="text-center text-4xl mb-6">
                <span className="cursor-pointer">Pixel Cat Callior</span>
            </h1>
            <div className="w-full max-w-sm bg-pixel-blue-frame pixel-border p-6">{children}</div>
        </div>
    )
}
