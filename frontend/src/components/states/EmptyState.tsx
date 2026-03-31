interface EmptyStateProps {
  title: string
  description: string
}

export const EmptyState = ({ title, description }: EmptyStateProps) => {
  return (
    <div role="note" className="glass-card card-shell rounded-2xl border border-slate-200/80 bg-slate-50/70 p-6 sm:p-8 text-center">
      <h3 className="text-base sm:text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </div>
  )
}
