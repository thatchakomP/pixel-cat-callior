// app/layout.tsx
import type { Metadata } from 'next'
// No need to import font if it's handled globally in CSS
import './globals.css'
import { Providers } from './providers' // Client component for session context
import Link from 'next/link'
import LogoutButton from '../components/LogoutButton' // Client component

export const metadata: Metadata = {
    title: 'Pixel Cat Calories',
    description: 'Gamified healthy eating with pixel art cats!',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <Providers>
                    <div className="min-h-screen flex flex-col items-center justify-center p-4">
                        <div className="w-full max-w-md bg-pixel-light pixel-border p-6 relative">
                            <h1 className="text-center text-4xl text-pixel-dark mb-6">
                                <Link href="/">
                                    <span className="cursor-pointer hover:text-pixel-accent transition-colors duration-200">
                                        Pixel Cat Callior
                                    </span>
                                </Link>
                            </h1>
                            <div className="absolute top-4 right-4">
                                <LogoutButton />
                            </div>
                            <main className="flex-grow flex flex-col justify-center items-center">
                                {children}
                            </main>
                        </div>
                    </div>
                </Providers>
            </body>
        </html>
    )
}
