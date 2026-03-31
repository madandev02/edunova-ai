interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export const ErrorState = ({ message, onRetry }: ErrorStateProps) => {
  return (
    <div role="alert" className="glass-card card-shell rounded-2xl border border-red-100 bg-red-50/80 p-6 sm:p-8 text-center">
      <h3 className="text-base sm:text-lg font-semibold text-red-700">Could not load this section</h3>
      <p className="mt-2 text-sm text-red-600">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="interactive-focus mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          Retry
        </button>
      ) : null}
    </div>
  )
}
