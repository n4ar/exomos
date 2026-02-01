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
      icon={
        <svg className="w-8 h-8 text-muted-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
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
      icon: (
        <svg className="w-8 h-8 text-muted-foreground/60" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
        </svg>
      ),
      title: 'ยังไม่มีวิชา',
      description:
        'สร้างวิชาแรกของคุณเพื่อเริ่มจัดระเบียบโน้ตและข้อสอบ',
      actionLabel: 'สร้างวิชา',
    },
    notes: {
      icon: (
        <svg className="w-8 h-8 text-muted-foreground/60" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      ),
      title: 'ยังไม่มีโน้ตที่อัปโหลด',
      description:
        'อัปโหลดโน้ต PDF แรกของคุณเพื่อเริ่มสร้างฐานความรู้',
      actionLabel: 'อัปโหลดโน้ต',
    },
    exams: {
      icon: (
        <svg className="w-8 h-8 text-muted-foreground/60" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V4zm2 0h10v12H5V4zm2 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      ),
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
