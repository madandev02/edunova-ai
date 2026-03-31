import { useState } from 'react'
import { Bot, Send, X } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAssistantMutation } from '../../features/assistant/mutations'

interface MessageItem {
  id: string
  role: 'user' | 'assistant'
  text: string
}

export const FloatingAssistantWidget = () => {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi, I am your EduNova assistant. Ask me what to study next.',
    },
  ])

  const assistantMutation = useAssistantMutation()

  const send = () => {
    const message = input.trim()
    if (!message) {
      return
    }

    const contextualMessage = `[page=${location.pathname}] ${message}`
    setMessages((previous) => [...previous, { id: crypto.randomUUID(), role: 'user', text: message }])
    setInput('')

    assistantMutation.mutate(
      { message: contextualMessage },
      {
        onSuccess: (response) => {
          setMessages((previous) => [
            ...previous,
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              text: response.reply,
            },
          ])
        },
      },
    )
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="w-[340px] rounded-3xl border border-[#d8e4e2] bg-[#f9fcfb] p-3.5 shadow-[0_16px_38px_rgba(25,64,59,0.18)]">
          <div className="flex items-center justify-between">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#17413d]">
              <Bot size={14} /> EduNova Copilot
            </p>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-500 transition hover:bg-white">
              <X size={14} />
            </button>
          </div>

          <div className="mt-2 h-64 space-y-2 overflow-y-auto rounded-2xl border border-[#d7e2e1] bg-white p-2.5">
            {messages.map((item) => (
              <p
                key={item.id}
                className={`rounded-xl px-2.5 py-2 text-xs leading-5 ${
                  item.role === 'assistant' ? 'bg-[#eef6f4] text-[#2a4f4a]' : 'bg-[#2f6f67] text-white'
                }`}
              >
                {item.text}
              </p>
            ))}

            {assistantMutation.isPending ? (
              <p className="rounded-xl bg-[#eef6f4] px-2.5 py-2 text-xs text-[#2a4f4a]">
                Thinking... analyzing your progress and weak topics.
              </p>
            ) : null}
          </div>

          <div className="mt-2 flex gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-[#cfdbd9] bg-white px-3 py-2 text-xs text-[#1f2f2d]"
              placeholder="Ask about weak areas..."
            />
            <button
              type="button"
              onClick={send}
              disabled={assistantMutation.isPending || !input.trim()}
              className="rounded-xl bg-[#2f6f67] px-3 py-2 text-white transition hover:bg-[#255a53] disabled:opacity-60"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[#2f6f67] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(26,78,71,0.28)] transition hover:-translate-y-0.5 hover:bg-[#255a53]"
        >
          <Bot size={16} />
          Ask AI
        </button>
      )}
    </div>
  )
}
