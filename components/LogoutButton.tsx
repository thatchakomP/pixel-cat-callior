// components/LogoutButton.tsx
'use client' // <-- ADD THIS

import { signOut, useSession } from 'next-auth/react'
import PixelButton from './PixelButton' // Assuming PixelButton is also 'use client'

const LogoutButton = () => {
    const { data: session } = useSession()

    if (!session) {
        return null // Don't show if not logged in
    }

    return (
        <PixelButton
            onClick={() => signOut({ callbackUrl: '/login' })}
            variant="danger"
            className="px-3 py-1 text-sm"
        >
            Logout
        </PixelButton>
    )
}

export default LogoutButton
