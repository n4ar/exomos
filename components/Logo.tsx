import Link from 'next/link'

interface LogoProps {
  href?: string
  className?: string
}

export function Logo({ href = '/dashboard', className = '' }: LogoProps) {
  const logoContent = (
    <h1 className={`text-xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent hover:opacity-80 transition-opacity ${className}`}>
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
