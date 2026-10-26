import { useTheme } from '@/context/ThemeContext'

export function AdhdDecorations() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      <svg
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Cone gradient */}
          <linearGradient id="coneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isDark ? '#5B68E4' : '#B8A8F8'} stopOpacity={isDark ? 0.45 : 0.65} />
            <stop offset="100%" stopColor={isDark ? '#2D348B' : '#8A76E8'} stopOpacity={isDark ? 0.25 : 0.4} />
          </linearGradient>

          {/* Torus gradient */}
          <linearGradient id="torusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isDark ? '#7E57C2' : '#C4B5FD'} stopOpacity={isDark ? 0.4 : 0.7} />
            <stop offset="100%" stopColor={isDark ? '#311B92' : '#9370DB'} stopOpacity={isDark ? 0.2 : 0.4} />
          </linearGradient>

          {/* Octahedron / Diamond gradient */}
          <linearGradient id="diamondGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isDark ? '#38BDF8' : '#93C5FD'} stopOpacity={isDark ? 0.4 : 0.6} />
            <stop offset="100%" stopColor={isDark ? '#0284C7' : '#60A5FA'} stopOpacity={isDark ? 0.2 : 0.35} />
          </linearGradient>

          <linearGradient id="diamondGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isDark ? '#1E40AF' : '#60A5FA'} stopOpacity={isDark ? 0.5 : 0.7} />
            <stop offset="100%" stopColor={isDark ? '#0F172A' : '#3B82F6'} stopOpacity={isDark ? 0.3 : 0.45} />
          </linearGradient>

          {/* Lime cone / wedge */}
          <linearGradient id="limeWedge" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isDark ? '#05FF85' : '#86EFAC'} stopOpacity={isDark ? 0.25 : 0.55} />
            <stop offset="100%" stopColor={isDark ? '#007A3D' : '#4ADE80'} stopOpacity={isDark ? 0.1 : 0.3} />
          </linearGradient>

          {/* Glow filter */}
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Top-Left 3D Cone */}
        <g transform="translate(60, 45) rotate(-22)" opacity={isDark ? 0.8 : 0.9}>
          <path d="M 50 15 L 12 110 A 38 18 0 0 0 88 110 Z" fill="url(#coneGrad)" />
          <ellipse cx="50" cy="110" rx="38" ry="16" fill={isDark ? '#3C45A5' : '#9E8CF4'} opacity="0.6" />
        </g>

        {/* 2. Top-Left Torus (Donut Ring) */}
        <g transform="translate(240, 60) rotate(35)" opacity={isDark ? 0.75 : 0.85}>
          <path
            d="M 50 20 C 78 20, 100 36, 100 55 C 100 74, 78 90, 50 90 C 22 90, 0 74, 0 55 C 0 36, 22 20, 50 20 Z
               M 50 36 C 36 36, 24 45, 24 55 C 24 65, 36 74, 50 74 C 64 74, 76 65, 76 55 C 76 45, 64 36, 50 36 Z"
            fill="url(#torusGrad)"
            fillRule="evenodd"
          />
        </g>

        {/* 3. Top-Right 3D Octahedron / Diamond */}
        <g transform="translate(1260, 40) rotate(15)" opacity={isDark ? 0.8 : 0.9}>
          <polygon points="60,10 110,65 60,120 10,65" fill="url(#diamondGrad1)" />
          <polygon points="60,10 60,120 10,65" fill="url(#diamondGrad2)" />
          <polygon points="60,10 110,65 60,120" fill="url(#diamondGrad1)" opacity="0.8" />
        </g>

        {/* 4. Bottom-Left Floating Wedge / Prism */}
        <g transform="translate(40, 700) rotate(25)" opacity={isDark ? 0.75 : 0.85}>
          <polygon points="20,10 90,40 50,110" fill="url(#limeWedge)" />
          <polygon points="20,10 50,110 5,75" fill={isDark ? '#04C264' : '#6EE7B7'} opacity="0.5" />
        </g>

        {/* 5. Bottom-Right Torus Ring & Sphere */}
        <g transform="translate(1280, 660) rotate(-28)" opacity={isDark ? 0.7 : 0.85}>
          <path
            d="M 45 15 C 70 15, 90 28, 90 45 C 90 62, 70 75, 45 75 C 20 75, 0 62, 0 45 C 0 28, 20 15, 45 15 Z
               M 45 28 C 32 28, 20 36, 20 45 C 20 54, 32 62, 45 62 C 58 62, 70 54, 70 45 C 70 36, 58 28, 45 28 Z"
            fill="url(#torusGrad)"
            fillRule="evenodd"
          />
        </g>

        {/* 6. Playful Doodle Sparkles & Stars */}
        <g stroke={isDark ? '#7E8EB8' : '#94A3B8'} strokeWidth="1.75" strokeLinecap="round" fill="none" opacity={isDark ? 0.55 : 0.75}>
          {/* Top Star 1 */}
          <path d="M 680 45 Q 680 60 665 60 Q 680 60 680 75 Q 680 60 695 60 Q 680 60 680 45 Z" />
          
          {/* Top-Right Star */}
          <path d="M 1030 65 L 1030 95 M 1015 80 L 1045 80" strokeWidth="2" />
          <circle cx="1030" cy="80" r="1.5" fill={isDark ? '#7E8EB8' : '#94A3B8'} />

          {/* Dashing motion lines */}
          <path d="M 880 75 L 895 62 M 900 82 L 918 69 M 915 95 L 935 84" />
          <path d="M 130 790 L 145 805 M 145 780 L 160 795 M 160 770 L 175 785" />

          {/* Bottom Star */}
          <path d="M 520 840 Q 520 855 505 855 Q 520 855 520 870 Q 520 855 535 855 Q 520 855 520 840 Z" />
        </g>
      </svg>
    </div>
  )
}
