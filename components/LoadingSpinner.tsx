// components/LoadingSpinner.tsx
'use client' // <-- ADD THIS

import React from 'react'

const LoadingSpinner: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center text-pixel-dark text-lg py-8">
            <div className="pixel-spinner">
                {/* Simple CSS animated pixel square */}
                <style jsx>{`
                    .pixel-spinner {
                        width: 48px;
                        height: 48px;
                        border: 4px solid currentColor;
                        box-sizing: border-box;
                        animation: spin 1s infinite linear;
                        position: relative;
                    }
                    .pixel-spinner::before {
                        content: '';
                        display: block;
                        width: 16px;
                        height: 16px;
                        background: currentColor;
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        animation: pulse 1s infinite alternate;
                    }

                    @keyframes spin {
                        0% {
                            transform: rotate(0deg);
                        }
                        100% {
                            transform: rotate(360deg);
                        }
                    }

                    @keyframes pulse {
                        0% {
                            transform: translate(-50%, -50%) scale(0.8);
                            opacity: 0.8;
                        }
                        100% {
                            transform: translate(-50%, -50%) scale(1.2);
                            opacity: 1;
                        }
                    }
                `}</style>
            </div>
            <p className="mt-4">Crunching pixels...</p>
        </div>
    )
}

export default LoadingSpinner
