import { useState } from 'react'

export function HelenMascot({
  mood = 'happy',
  className = '',
  waving = true,
}: {
  mood?: 'happy' | 'calm' | 'focus'
  className?: string
  waving?: boolean
}) {
  const [imgError, setImgError] = useState(false)

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      {/* Ambient background glow matching blue mascot */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 rounded-full opacity-65 blur-2xl transition-all duration-300 dark:opacity-85"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.45) 0%, rgba(37, 99, 235, 0.25) 45%, rgba(0, 229, 255, 0.15) 65%, transparent 75%)',
        }}
      />

      {!imgError ? (
        <div className={`relative flex h-full w-full items-center justify-center transition-transform duration-300 hover:scale-105 ${waving ? 'animate-mascot-float' : ''}`}>
          <img
            src="/mascot-blue.png"
            alt="Helen, your friendly AI companion"
            className="h-full w-full object-contain drop-shadow-[0_12px_24px_rgba(37,99,235,0.35)] dark:drop-shadow-[0_14px_30px_rgba(0,229,255,0.3)]"
            onError={() => setImgError(true)}
            draggable={false}
          />
        </div>
      ) : (
        /* Vector SVG Fallback: Blue Mascot matching the 3D plush cat character */
        <svg
          viewBox="0 0 160 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full drop-shadow-[0_12px_24px_rgba(37,99,235,0.35)]"
          aria-hidden="true"
        >
          <defs>
            {/* Blue body radial gradient */}
            <radialGradient id="blueBodyGrad" cx="42%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="40%" stopColor="#3B82F6" />
              <stop offset="85%" stopColor="#1D4ED8" />
              <stop offset="100%" stopColor="#1E3A8A" />
            </radialGradient>

            {/* Ear gradient left */}
            <linearGradient id="blueEarLeft" x1="0%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#60A5FA" />
            </linearGradient>

            {/* Ear gradient right */}
            <linearGradient id="blueEarRight" x1="0%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#1D4ED8" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>

            {/* Arm/Leg gradient */}
            <linearGradient id="blueLimbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1E40AF" />
            </linearGradient>

            {/* Floor shadow */}
            <radialGradient id="blueFloorShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0B132B" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0B132B" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Floor drop shadow */}
          <ellipse cx="80" cy="172" rx="42" ry="7" fill="url(#blueFloorShadow)" />

          {/* Pointed Cat Ears */}
          <path
            d="M 44 48 C 36 28, 40 16, 52 24 C 60 30, 62 42, 60 52 Z"
            fill="url(#blueEarLeft)"
          />
          <path
            d="M 116 48 C 124 28, 120 16, 108 24 C 100 30, 98 42, 100 52 Z"
            fill="url(#blueEarRight)"
          />

          {/* Left Foot */}
          <ellipse cx="64" cy="162" rx="12" ry="14" fill="url(#blueLimbGrad)" />
          {/* Right Foot (Playfully lifted/kicked) */}
          <ellipse cx="106" cy="154" rx="12" ry="12" transform="rotate(18 106 154)" fill="url(#blueLimbGrad)" />

          {/* Left Arm (Resting) */}
          <ellipse cx="36" cy="108" rx="10" ry="14" transform="rotate(-15 36 108)" fill="url(#blueLimbGrad)" />

          {/* Right Arm (Waving high) */}
          <ellipse cx="128" cy="88" rx="12" ry="16" transform="rotate(35 128 88)" fill="url(#blueLimbGrad)" />

          {/* Round Plush Chubby Body */}
          <circle cx="80" cy="95" r="50" fill="url(#blueBodyGrad)" />

          {/* Big White Cartoon Eyes with tilt */}
          <ellipse cx="60" cy="88" rx="16" ry="18" transform="rotate(-5 60 88)" fill="#FFFFFF" />
          <ellipse cx="100" cy="88" rx="16" ry="18" transform="rotate(5 100 88)" fill="#FFFFFF" />

          {/* Large Glossy Dark Pupils */}
          <circle cx="63" cy="88" r="11" fill="#0F172A" />
          <circle cx="97" cy="88" r="11" fill="#0F172A" />

          {/* Specular Catchlights */}
          <circle cx="60" cy="84" r="4" fill="#FFFFFF" />
          <circle cx="94" cy="84" r="4" fill="#FFFFFF" />
          <circle cx="66" cy="91" r="1.5" fill="#FFFFFF" opacity="0.7" />
          <circle cx="100" cy="91" r="1.5" fill="#FFFFFF" opacity="0.7" />

          {/* Tiny Cute Nose */}
          <ellipse cx="80" cy="95" rx="2.5" ry="1.8" fill="#1E3A8A" />

          {/* Sweet Cat Mouth / Grin */}
          {mood === 'calm' ? (
            <path
              d="M 76 99 Q 80 102 84 99"
              stroke="#0F172A"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
          ) : (
            <path
              d="M 74 98 Q 77 102 80 99 Q 83 102 86 98"
              stroke="#0F172A"
              strokeWidth="2.4"
              strokeLinecap="round"
              fill="none"
            />
          )}
        </svg>
      )}
    </div>
  )
}
