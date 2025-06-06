// components/BottomNavBar.tsx
'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItemProps {
    href: string
    icon: React.ReactNode
    label: string
    isActive: boolean
}

const NavItem: React.FC<NavItemProps> = ({ href, icon, label, isActive }) => (
    <Link
        href={href}
        className="flex-1 flex flex-col items-center justify-center p-2 text-center no-underline"
    >
        <div className={`text-2xl mb-1 ${isActive ? 'text-pixel-yellow' : 'text-pixel-blue-text'}`}>
            {icon}
        </div>
        <span className={`text-xs ${isActive ? 'text-pixel-yellow' : 'text-pixel-blue-text'}`}>
            {label}
        </span>
    </Link>
)

const BottomNavBar: React.FC = () => {
    const pathname = usePathname()

    return (
        // Changed bg-pixel-blue-dark to bg-pixel-blue-dark for direct class usage
        // Adjusted border color to match the new convention (if applicable)
        <nav className="fixed bottom-0 left-0 w-full bg-pixel-blue-dark border-t-3 border-pixel-blue-medium shadow-lg z-50">
            <div className="flex justify-around items-center h-16 w-full max-w-md mx-auto">
                <NavItem href="/" label="Home" icon="🏠" isActive={pathname === '/'} />
                <NavItem
                    href="/upload"
                    label="Upload"
                    icon="📸"
                    isActive={pathname === '/upload'}
                />
                <NavItem
                    href="/collection"
                    label="Cats"
                    icon="🐾"
                    isActive={pathname === '/collection'}
                />
            </div>
        </nav>
    )
}

export default BottomNavBar
