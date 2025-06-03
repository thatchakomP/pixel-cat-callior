// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css' // Make sure this import is correct and exists
import { Providers } from './providers'
import LogoutButton from '../components/LogoutButton'
import BottomNavBar from '../components/BottomNavBar' // NEW IMPORT

export const metadata: Metadata = {
    title: 'Pixel Cat Callior',
    description: 'Gamified healthy eating with pixel art cats!',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                {/* This div should span the full viewport height to enable proper flexbox alignment */}
                <div className="min-h-screen flex flex-col items-center justify-between bg-pixel-blue-dark">
                    {' '}
                    {/* Added bg-pixel-blue-dark here too */}
                    <Providers>
                        {' '}
                        {/* Providers should wrap the content that uses context */}
                        {/* Top Bar / Minimalist Header */}
                        <header className="status-bar-header">
                            <span className="text-pixel-blue-text">Pixel Cat Callior</span>{' '}
                            {/* Simple text title */}
                            <div className="relative">
                                <LogoutButton />
                            </div>
                        </header>
                        {/* Main Content Area - this will scroll within its container */}
                        {/* Center the content, limit width, ensure it's scrollable, and adjust margins for bottom nav */}
                        <main className="flex-grow w-full max-w-md bg-pixel-blue-frame pixel-border p-4 mt-4 mb-20 overflow-auto">
                            {children}
                        </main>
                        {/* Bottom Navigation Bar */}
                        <BottomNavBar />
                    </Providers>
                </div>
            </body>
        </html>
    )
}
