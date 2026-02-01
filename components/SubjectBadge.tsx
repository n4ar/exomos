import { cn } from '@/lib/utils'

interface SubjectBadgeProps {
  name?: string
  children?: React.ReactNode
  color?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'solid' | 'outline' | 'soft'
  className?: string
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
}

export function SubjectBadge({
  name,
  children,
  color = '#6366f1',
  size = 'md',
  variant = 'soft',
  className,
}: SubjectBadgeProps) {
  const displayName = children || name
  const getVariantStyles = () => {
    switch (variant) {
      case 'solid':
        return {
          backgroundColor: color,
          color: '#ffffff',
          border: 'none',
        }
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: color,
          borderColor: color,
          borderWidth: '1.5px',
        }
      case 'soft':
      default:
        return {
          backgroundColor: `${color}15`,
          color: color,
          border: `1px solid ${color}30`,
        }
    }
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        'transition-all duration-300 hover:scale-105',
        'whitespace-nowrap',
        sizeClasses[size],
        className
      )}
      style={getVariantStyles()}
    >
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ backgroundColor: color }}
      />
      <span className="truncate max-w-[120px]">{displayName}</span>
    </span>
  )
}

interface SubjectColorPickerProps {
  value: string
  onChange: (color: string) => void
}

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#f43f5e', // Rose
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#14b8a6', // Teal
  '#f97316', // Orange
]

export function SubjectColorPicker({ value, onChange }: SubjectColorPickerProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Subject Color</label>
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={cn(
              'w-8 h-8 rounded-full transition-all duration-300',
              'hover:scale-110 hover:shadow-lg',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              value === color && 'ring-2 ring-offset-2 scale-110'
            )}
            style={{
              backgroundColor: color,
              '--tw-ring-color': color,
            } as React.CSSProperties}
            aria-label={`Select color ${color}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-12 rounded-lg cursor-pointer border-2 border-border"
        />
        <div className="flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#6366f1"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono"
          />
        </div>
      </div>
    </div>
  )
}
