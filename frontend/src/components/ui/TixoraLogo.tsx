interface TixoraLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function TixoraLogo({ className, size = 'md' }: TixoraLogoProps) {
  const h = size === 'sm' ? 20 : size === 'md' ? 28 : 40
  const w = Math.round(h * 3.2)

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 160 50"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="tixoraWordGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#134E4A" />
          <stop offset="60%" stopColor="#0D9488" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>
      </defs>
      <text
        x="80"
        y="38"
        fontFamily="Helvetica Neue,Helvetica,Arial,sans-serif"
        fontSize="42"
        fontWeight="700"
        letterSpacing="-2"
        textAnchor="middle"
        fill="url(#tixoraWordGrad)"
      >
        Tixora
      </text>
    </svg>
  )
}
