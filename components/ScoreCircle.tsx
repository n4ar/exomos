import { cn } from '@/lib/utils'

interface ScoreCircleProps {
  score: number
  maxScore?: number
  size?: number
  strokeWidth?: number
  showLabel?: boolean
  showPercentage?: boolean
  variant?: 'default' | 'gradient' | 'status'
  status?: 'excellent' | 'good' | 'average' | 'poor'
  className?: string
}

export function ScoreCircle({
  score,
  maxScore = 100,
  size = 160,
  strokeWidth = 12,
  showLabel = true,
  showPercentage = true,
  variant = 'gradient',
  status: _status,
  className,
}: ScoreCircleProps) {
  const percentage = Math.min(Math.round((score / maxScore) * 100), 100)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  // Determine status color based on percentage
  const getStatusColor = () => {
    if (percentage >= 80) return { from: '#10b981', to: '#059669' } // Green
    if (percentage >= 60) return { from: '#f59e0b', to: '#d97706' } // Amber
    return { from: '#ef4444', to: '#dc2626' } // Red
  }

  const statusColor = getStatusColor()

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90 drop-shadow-lg"
      >
        <defs>
          {/* Gradient for default variant */}
          <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>

          {/* Gradient for status variant */}
          <linearGradient id="status-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={statusColor.from} />
            <stop offset="100%" stopColor={statusColor.to} />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted opacity-30"
        />

        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={
            variant === 'status'
              ? 'url(#status-gradient)'
              : variant === 'gradient'
              ? 'url(#score-gradient)'
              : '#6366f1'
          }
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          filter="url(#glow)"
        />
      </svg>

      {/* Center Content */}
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-center">
            {showPercentage ? (
              <>
                <div className="text-4xl font-bold gradient-text mb-1">
                  {percentage}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {score}/{maxScore}
                </div>
              </>
            ) : (
              <div className="text-4xl font-bold gradient-text">
                {score}
                <span className="text-2xl text-muted-foreground">/{maxScore}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface ScoreCardProps {
  score: number
  maxScore?: number
  title?: string
  subtitle?: string
  status?: 'passed' | 'failed' | 'pending'
  className?: string
}

export function ScoreCard({
  score,
  maxScore = 100,
  title = 'Your Score',
  subtitle,
  status,
  className,
}: ScoreCardProps) {
  const percentage = Math.round((score / maxScore) * 100)

  const getStatusConfig = () => {
    if (status === 'passed' || percentage >= 60) {
      return {
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ),
        label: 'Passed',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/20',
      }
    }
    if (status === 'failed' || percentage < 60) {
      return {
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        ),
        label: 'Failed',
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
      }
    }
    return {
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      ),
      label: 'Pending',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    }
  }

  const statusConfig = getStatusConfig()

  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card p-8',
        'animate-fade-in-up',
        className
      )}
    >
      <div className="flex flex-col items-center text-center space-y-6">
        {/* Title */}
        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {/* Score Circle */}
        <ScoreCircle
          score={score}
          maxScore={maxScore}
          variant="status"
          size={180}
          strokeWidth={14}
        />

        {/* Status Badge */}
        {status && (
          <div
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-full',
              'border font-medium',
              statusConfig.bgColor,
              statusConfig.borderColor,
              statusConfig.color
            )}
          >
            {statusConfig.icon}
            <span>{statusConfig.label}</span>
          </div>
        )}
      </div>
    </div>
  )
}

interface MiniScoreCircleProps {
  score: number
  maxScore?: number
  size?: number
  className?: string
}

export function MiniScoreCircle({
  score,
  maxScore = 100,
  size = 48,
  className,
}: MiniScoreCircleProps) {
  const percentage = Math.round((score / maxScore) * 100)
  const strokeWidth = 4
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className={cn('relative inline-flex', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted opacity-30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(
            'transition-all duration-500',
            percentage >= 80 && 'text-green-500',
            percentage >= 60 && percentage < 80 && 'text-amber-500',
            percentage < 60 && 'text-red-500'
          )}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-foreground">{percentage}%</span>
      </div>
    </div>
  )
}

interface ScoreComparisonProps {
  currentScore: number
  previousScore?: number
  maxScore?: number
  className?: string
}

export function ScoreComparison({
  currentScore,
  previousScore,
  maxScore = 100,
  className,
}: ScoreComparisonProps) {
  if (!previousScore) return null

  const currentPercentage = Math.round((currentScore / maxScore) * 100)
  const previousPercentage = Math.round((previousScore / maxScore) * 100)
  const difference = currentPercentage - previousPercentage
  const isImprovement = difference > 0

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
        'border text-sm font-medium',
        isImprovement
          ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
          : difference === 0
          ? 'bg-muted border-border text-muted-foreground'
          : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400',
        className
      )}
    >
      {isImprovement ? (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : difference === 0 ? (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
      <span>
        {difference === 0
          ? 'Same as before'
          : `${isImprovement ? '+' : ''}${difference}% from last attempt`}
      </span>
    </div>
  )
}
