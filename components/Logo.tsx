import Link from 'next/link'

interface LogoProps {
  href?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
}

export function Logo({ href = '/dashboard', className = '', size = 'md', showText = true }: LogoProps) {
  if (!showText) {
    return null
  }
  const logoContent = (
    <h1 className={`${sizeClasses[size]} font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent hover:opacity-80 transition-opacity ${className}`}>
      Exomos
    </h1>
  )

  if (href) {
    return (
      <Link href={href}>
        {logoContent}
      </Link>
    )
  }

  return logoContent
}
