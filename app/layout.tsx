// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import LogoutButton from '../components/LogoutButton'
import BottomNavBar from '../components/BottomNavBar'

export const metadata: Metadata = {
    title: 'Pixel Cat Callior',
    description: 'Gamified healthy eating with pixel art cats!',
}

// Add explicit return type 'JSX.Element' or 'React.ReactElement'
export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
    // <--- ADDED RETURN TYPE HERE
    return (
        <html lang="en">
            <body>
                <div className="min-h-screen flex flex-col items-center justify-between">
                    <Providers>
                        <header className="status-bar-header">
                            <span>BM</span>
                            <span className="text-pixel-blue-text">Pixel Cat Callior</span>
                            <div className="relative">
                                <LogoutButton />
                            </div>
                        </header>

                        <main className="flex-grow w-full max-w-md bg-pixel-blue-frame pixel-border p-4 mt-4 mb-20 overflow-auto">
                            {children}
                        </main>

                        <BottomNavBar />
                    </Providers>
                </div>
            </body>
        </html>
    )
}
