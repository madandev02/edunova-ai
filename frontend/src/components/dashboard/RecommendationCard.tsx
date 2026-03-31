import { Sparkles } from 'lucide-react'
import { StatusBadge } from '../ui/StatusBadge'
import type { Recommendation } from '../../types/api'

interface RecommendationCardProps {
  recommendation: Recommendation
}

const decayRuleLabel: Record<string, string> = {
  none: 'Decay: none',
  recent_pause: 'Decay: recent pause (<=24h)',
  warm_stale: 'Decay: warm stale (24-72h)',
  cold_relevant: 'Decay: cold but relevant (>72h)',
}

export const RecommendationCard = ({ recommendation }: RecommendationCardProps) => {
  const rawDecayRule = recommendation.decayRule ?? 'none'
  const decayLabel = decayRuleLabel[rawDecayRule] ?? `Decay: ${rawDecayRule.replaceAll('_', ' ')}`

  return (
    <article className="rounded-xl border border-sky-100 bg-sky-50/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-ink">{recommendation.topic}</h4>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-brand">
            <Sparkles size={14} />
            AI recommendation
          </p>
        </div>
        <StatusBadge value={recommendation.priority} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
          {decayLabel}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">{recommendation.reason}</p>
    </article>
  )
}