export function HelenMascot({
  mood = 'happy',
  className = '',
  waving = true,
}: {
  mood?: 'happy' | 'calm' | 'focus'
  className?: string
  waving?: boolean
}) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 rounded-full opacity-60 blur-xl dark:opacity-75"
        style={{
          background: 'radial-gradient(circle, rgba(162, 242, 84, 0.5) 0%, rgba(5, 255, 133, 0.2) 50%, transparent 70%)',
        }}
      />

      <svg
        viewBox="0 0 160 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full drop-shadow-[0_8px_20px_rgba(5,255,133,0.25)]"
        aria-hidden="true"
      >
        <defs>
          {/* Main Body Gradient: soft 3D shaded lime green */}
          <radialGradient id="helenBodyGrad" cx="40%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#C6F86E" />
            <stop offset="45%" stopColor="#A4E948" />
            <stop offset="85%" stopColor="#7CC92E" />
            <stop offset="100%" stopColor="#5E9F1D" />
          </radialGradient>

          {/* Left Horn/Antenna Gradient */}
          <linearGradient id="helenHornLeft" x1="0%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#A4E948" />
            <stop offset="100%" stopColor="#C8FA74" />
          </linearGradient>

          {/* Right Horn/Antenna Gradient */}
          <linearGradient id="helenHornRight" x1="0%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#82D22E" />
            <stop offset="100%" stopColor="#B4F258" />
          </linearGradient>

          {/* Arm Gradient */}
          <linearGradient id="helenArmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B6F35C" />
            <stop offset="100%" stopColor="#6CAE24" />
          </linearGradient>

          {/* Leg Gradient */}
          <linearGradient id="helenLegGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7CC92E" />
            <stop offset="100%" stopColor="#4E8817" />
          </linearGradient>

          {/* Specular highlight */}
          <linearGradient id="helenSpecGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Floor Shadow */}
          <radialGradient id="helenFloorShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0B132B" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0B132B" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Floor drop shadow */}
        <ellipse cx="80" cy="172" rx="42" ry="7" fill="url(#helenFloorShadow)" />

        {/* Left Foot */}
        <ellipse cx="62" cy="160" rx="11" ry="14" fill="url(#helenLegGrad)" />
        
        {/* Right Foot */}
        <ellipse cx="98" cy="160" rx="11" ry="14" fill="url(#helenLegGrad)" />

        {/* Left Antenna / Horn */}
        <path
          d="M 52 50 C 44 38, 36 24, 40 16 C 43 10, 52 14, 57 26 C 60 33, 62 43, 62 49 Z"
          fill="url(#helenHornLeft)"
        />

        {/* Right Antenna / Horn */}
        <path
          d="M 108 50 C 116 38, 124 24, 120 16 C 117 10, 108 14, 103 26 C 100 33, 98 43, 98 49 Z"
          fill="url(#helenHornRight)"
        />

        {/* Left Arm (Resting / slightly raised) */}
        <path
          d="M 38 98 C 22 92, 16 102, 22 114 C 28 126, 38 122, 45 110 Z"
          fill="url(#helenArmGrad)"
        />

        {/* Right Arm: Waving if waving=true, or resting */}
        {waving ? (
          <g>
            <path
              d="M 122 96 C 138 86, 146 72, 142 64 C 137 57, 128 66, 120 80 C 117 85, 116 92, 118 97 Z"
              fill="url(#helenArmGrad)"
            />
            {/* Cute waving hand ball */}
            <circle cx="140" cy="65" r="7" fill="#B4F258" />
          </g>
        ) : (
          <path
            d="M 122 98 C 138 92, 144 102, 138 114 C 132 126, 122 122, 115 110 Z"
            fill="url(#helenArmGrad)"
          />
        )}

        {/* Main Pear-Shaped Chubby Body */}
        <path
          d="M 80 44 
             C 106 44, 122 58, 124 82 
             C 126 106, 132 134, 118 150 
             C 104 164, 56 164, 42 150 
             C 28 134, 34 106, 36 82 
             C 38 58, 54 44, 80 44 Z"
          fill="url(#helenBodyGrad)"
        />

        {/* Top 3D Specular Highlight */}
        <ellipse cx="80" cy="56" rx="30" ry="10" fill="url(#helenSpecGrad)" opacity="0.6" />

        {/* Left Eye */}
        <circle cx="68" cy="92" r="5.2" fill="#0E1726" />
        {/* Specular Catchlight Left */}
        <circle cx="66.5" cy="90" r="1.8" fill="#FFFFFF" />

        {/* Right Eye */}
        <circle cx="94" cy="92" r="5.2" fill="#0E1726" />
        {/* Specular Catchlight Right */}
        <circle cx="92.5" cy="90" r="1.8" fill="#FFFFFF" />

        {/* Smile: relaxed curve or happy grin */}
        {mood === 'calm' ? (
          <path
            d="M 75 106 Q 81 110 87 106"
            stroke="#0E1726"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M 73 104 Q 81 113 89 104"
            stroke="#0E1726"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        )}

        {/* Focus Mode subtle concentrated mark */}
        {mood === 'focus' && (
          <path
            d="M 71 82 L 91 82"
            stroke="#0E1726"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        )}
      </svg>
    </div>
  )
}
