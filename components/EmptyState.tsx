import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        'animate-fade-in-up',
        className
      )}
    >
      {/* Icon Container with Gradient Background */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 rounded-full blur-2xl" />
        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 flex items-center justify-center border border-border/50">
          <div className="text-4xl text-muted-foreground/60">{icon}</div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md space-y-2 mb-6">
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            'px-6 py-3 rounded-xl font-medium transition-all duration-300',
            'hover:scale-105 hover:shadow-lg',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            action.variant === 'secondary'
              ? 'bg-secondary text-secondary-foreground hover:shadow-secondary/20 focus:ring-secondary'
              : 'bg-gradient-to-r from-primary to-accent text-white hover:shadow-primary/20 focus:ring-primary'
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

interface EmptyStateCardProps {
  icon: ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyStateCard({
  icon,
  title,
  description,
  action,
}: EmptyStateCardProps) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border/50 bg-muted/20 p-8">
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        action={action}
        className="py-8"
      />
    </div>
  )
}

interface EmptySearchResultsProps {
  query: string
  onClear?: () => void
}

export function EmptySearchResults({ query, onClear }: EmptySearchResultsProps) {
  return (
    <EmptyState
      icon="🔍"
      title="ไม่พบผลลัพธ์"
      description={`ไม่พบสิ่งใดที่ตรงกับ "${query}" ลองปรับคำค้นหาหรือตัวกรองของคุณ`}
      action={
        onClear
          ? {
              label: 'ล้างการค้นหา',
              onClick: onClear,
              variant: 'secondary',
            }
          : undefined
      }
    />
  )
}

interface EmptyDataStateProps {
  type: 'subjects' | 'notes' | 'exams'
  onCreate?: () => void
}

export function EmptyDataState({ type, onCreate }: EmptyDataStateProps) {
  const config = {
    subjects: {
      icon: '📚',
      title: 'ยังไม่มีวิชา',
      description:
        'สร้างวิชาแรกของคุณเพื่อเริ่มจัดระเบียบโน้ตและข้อสอบ',
      actionLabel: 'สร้างวิชา',
    },
    notes: {
      icon: '📄',
      title: 'ยังไม่มีโน้ตที่อัปโหลด',
      description:
        'อัปโหลดโน้ต PDF แรกของคุณเพื่อเริ่มสร้างฐานความรู้',
      actionLabel: 'อัปโหลดโน้ต',
    },
    exams: {
      icon: '📝',
      title: 'ยังไม่มีข้อสอบที่สร้าง',
      description:
        'สร้างข้อสอบแรกจากโน้ตของคุณเพื่อทดสอบความรู้',
      actionLabel: 'สร้างข้อสอบ',
    },
  }

  const { icon, title, description, actionLabel } = config[type]

  return (
    <EmptyStateCard
      icon={icon}
      title={title}
      description={description}
      action={
        onCreate
          ? {
              label: actionLabel,
              onClick: onCreate,
            }
          : undefined
      }
    />
  )
}
