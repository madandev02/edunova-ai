interface LoadingStateProps {
  label?: string
}

export const LoadingState = ({ label = 'Loading data...' }: LoadingStateProps) => {
  return (
    <div role="status" aria-live="polite" className="glass-card card-shell rounded-2xl border border-white/80 p-6 sm:p-8 text-center">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand/25 border-t-brand" />
      <p className="mt-3 text-sm font-medium text-muted">{label}</p>
      <div className="mx-auto mt-3 h-2 w-40 animate-pulse rounded-full bg-slate-200" />
    </div>
  )
}
