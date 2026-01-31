import { cn } from '@/lib/utils'

interface ProgressBarProps {
  current: number
  total: number
  showLabel?: boolean
  showPercentage?: boolean
  variant?: 'default' | 'gradient' | 'striped'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}

export function ProgressBar({
  current,
  total,
  showLabel = true,
  showPercentage = true,
  variant = 'gradient',
  size = 'md',
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.round((current / total) * 100), 100)

  return (
    <div className={cn('w-full space-y-2', className)}>
      {/* Label */}
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            {current} of {total}
          </span>
          {showPercentage && (
            <span className="text-muted-foreground">{percentage}%</span>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div
        className={cn(
          'relative w-full rounded-full bg-muted overflow-hidden',
          sizeClasses[size]
        )}
      >
        {/* Background Pattern for Striped Variant */}
        {variant === 'striped' && (
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px)',
            }}
          />
        )}

        {/* Progress Fill */}
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out relative overflow-hidden',
            variant === 'gradient' &&
              'bg-gradient-to-r from-primary via-accent to-secondary',
            variant === 'default' && 'bg-primary',
            variant === 'striped' && 'bg-gradient-to-r from-primary to-accent'
          )}
          style={{ width: `${percentage}%` }}
        >
          {/* Shimmer Effect */}
          {variant === 'gradient' && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              style={{
                animation: 'shimmer 2s infinite',
              }}
            />
          )}

          {/* Striped Animation */}
          {variant === 'striped' && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px)',
                animation: 'progress-stripes 1s linear infinite',
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

interface CircularProgressProps {
  percentage: number
  size?: number
  strokeWidth?: number
  showLabel?: boolean
  className?: string
}

export function CircularProgress({
  percentage,
  size = 120,
  strokeWidth = 8,
  showLabel = true,
  className,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
        </defs>

        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted"
        />

        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progress-gradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      {/* Label */}
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold gradient-text">{percentage}%</span>
        </div>
      )}
    </div>
  )
}

interface StepProgressProps {
  steps: string[]
  currentStep: number
  className?: string
}

export function StepProgress({ steps, currentStep, className }: StepProgressProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isUpcoming = index > currentStep

          return (
            <div key={index} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    'transition-all duration-300 relative',
                    isCompleted &&
                      'bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/20',
                    isCurrent &&
                      'bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/30 scale-110',
                    isUpcoming && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}

                  {/* Pulse Animation for Current Step */}
                  {isCurrent && (
                    <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" />
                  )}
                </div>

                {/* Step Label */}
                <span
                  className={cn(
                    'mt-2 text-xs font-medium text-center max-w-[80px]',
                    isCurrent && 'text-foreground',
                    isCompleted && 'text-foreground',
                    isUpcoming && 'text-muted-foreground'
                  )}
                >
                  {step}
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 relative">
                  <div className="absolute inset-0 bg-muted" />
                  <div
                    className={cn(
                      'absolute inset-0 bg-gradient-to-r from-primary to-accent transition-all duration-500',
                      isCompleted ? 'w-full' : 'w-0'
                    )}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
