import { cn } from '../../lib/cn'
import type { LessonStatus, RecommendationPriority } from '../../types/api'

type StatusBadgeVariant = RecommendationPriority | LessonStatus

interface StatusBadgeProps {
  value: StatusBadgeVariant
}

const labelMap: Record<StatusBadgeVariant, string> = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
  completed: 'Completed',
  in_progress: 'In Progress',
  locked: 'Locked',
}

const styleMap: Record<StatusBadgeVariant, string> = {
  HIGH: 'bg-red-100 text-red-700 border-red-200',
  MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
  LOW: 'bg-sky-100 text-sky-700 border-sky-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  locked: 'bg-slate-100 text-slate-600 border-slate-200',
}

export const StatusBadge = ({ value }: StatusBadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide',
        styleMap[value],
      )}
    >
      {labelMap[value]}
    </span>
  )
}
