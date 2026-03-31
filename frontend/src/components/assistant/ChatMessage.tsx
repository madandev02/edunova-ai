import { Bot, User } from 'lucide-react'
import { cn } from '../../lib/cn'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  context?: string
}

export const ChatMessage = ({ role, content, context }: ChatMessageProps) => {
  const isAssistant = role === 'assistant'

  return (
    <article
      className={cn('flex items-start gap-3 rounded-2xl p-4', {
        'bg-white/75': isAssistant,
        'bg-brand text-white': !isAssistant,
      })}
    >
      <span
        className={cn(
          'mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full border',
          isAssistant ? 'border-brand/30 bg-brand/10 text-brand' : 'border-white/20 bg-white/10 text-white',
        )}
      >
        {isAssistant ? <Bot size={14} /> : <User size={14} />}
      </span>

      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-semibold', isAssistant ? 'text-ink' : 'text-white')}>{
          isAssistant ? 'EduNova Assistant' : 'You'
        }</p>
        <p className={cn('mt-1 whitespace-pre-line text-sm leading-6', isAssistant ? 'text-slate-700' : 'text-blue-50')}>{content}</p>
        {context ? (
          <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-500">
            Context: {context}
          </p>
        ) : null}
      </div>
    </article>
  )
}
