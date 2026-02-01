import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BentoCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  gradient?: boolean
  glass?: boolean
  onClick?: () => void
  style?: React.CSSProperties
}

export function BentoCard({
  children,
  className,
  hover = true,
  gradient = false,
  glass = false,
  onClick,
  style,
}: BentoCardProps) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={cn(
        'relative rounded-2xl p-6 transition-all duration-500',
        'bg-card border border-border',
        hover && 'hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 hover:-translate-y-1',
        gradient && 'bento-card-gradient',
        glass && 'glass',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {gradient && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  )
}

interface BentoCardHeaderProps {
  icon?: ReactNode
  title: string
  description?: string
  badge?: ReactNode
}

export function BentoCardHeader({
  icon,
  title,
  description,
  badge,
}: BentoCardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-start gap-3 flex-1">
        {icon && (
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-lg shadow-primary/20">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground mb-1 truncate">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>
      {badge && <div className="flex-shrink-0 ml-2">{badge}</div>}
    </div>
  )
}

interface BentoCardFooterProps {
  children: ReactNode
  className?: string
}

export function BentoCardFooter({ children, className }: BentoCardFooterProps) {
  return (
    <div
      className={cn(
        'mt-4 pt-4 border-t border-border/50 flex items-center justify-between',
        className
      )}
    >
      {children}
    </div>
  )
}
