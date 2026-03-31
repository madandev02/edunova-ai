import { useState } from 'react'
import type { FormEvent } from 'react'
import { Send } from 'lucide-react'
import { Alert, Box, Button, Card, CardContent, Paper, Stack, TextField, Typography } from '@mui/material'
import { ChatMessage } from '../components/assistant/ChatMessage'
import { EmptyState } from '../components/states/EmptyState'
import { useAssistantMutation } from '../features/assistant/mutations'
import { usePageTitle } from '../hooks/usePageTitle'

interface ChatItem {
  id: string
  role: 'user' | 'assistant'
  content: string
  context?: string
}

export const AssistantPage = () => {
  usePageTitle('Assistant')

  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatItem[]>([])
  const assistantMutation = useAssistantMutation()

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()

    const message = input.trim()
    if (!message) {
      return
    }

    const userMessage: ChatItem = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
    }

    setMessages((previous) => [...previous, userMessage])
    setInput('')

    assistantMutation.mutate(
      { message },
      {
        onSuccess: (response) => {
          setMessages((previous) => [
            ...previous,
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: response.reply,
              context: response.context,
            },
          ])
        },
      },
    )
  }

  return (
    <Stack spacing={2.2}>
      <Paper
        sx={{ borderRadius: 5, border: '1px solid', borderColor: 'divider', p: { xs: 2.2, md: 3 }, bgcolor: 'rgba(255,255,255,0.74)' }}
      >
        <Typography sx={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.11em', color: 'primary.main', fontWeight: 700 }}>
          Progress-Aware Assistant
        </Typography>
        <Typography variant="h4" sx={{ mt: 1.1 }}>Ask for targeted help from your learning signals</Typography>
        <Typography sx={{ mt: 1.2, color: 'text.secondary' }}>
          Responses are contextualized with your progress, weak areas, and recent attempts.
        </Typography>
      </Paper>

      <Card sx={{ borderRadius: 4, minHeight: { xs: 'auto', sm: '65vh' }, display: 'flex', flexDirection: 'column', maxHeight: { xs: 'unset', sm: '65vh' } }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', minHeight: { xs: 240, sm: '65vh' }, p: { xs: 2, sm: 3 } }}>
          <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: { xs: 0.3, sm: 0.5 } }}>
            {messages.length === 0 ? (
              <EmptyState
                title="No conversation yet"
                description="Ask why a topic is recommended or request a personalized study plan."
              />
            ) : (
              <Stack spacing={1.2}>
                {messages.map((item) => (
                  <ChatMessage key={item.id} role={item.role} content={item.content} context={item.context} />
                ))}
              </Stack>
            )}

            {assistantMutation.isPending ? (
              <Paper variant="outlined" sx={{ mt: 1.5, borderRadius: 3, p: 1.4, bgcolor: '#f2fbf8', color: 'text.secondary' }}>
                Thinking... analyzing your learning context and retrieving relevant course evidence.
              </Paper>
            ) : null}

            {assistantMutation.isError ? (
              <Alert severity="error" sx={{ mt: 1.5 }}>
                {(assistantMutation.error as Error).message}
              </Alert>
            ) : null}
          </Box>

          <Box component="form" onSubmit={onSubmit} sx={{ mt: { xs: 1.5, sm: 2 }, pt: { xs: 1.5, sm: 2 }, borderTop: '1px solid', borderColor: 'divider' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'flex-end' }}>
              <TextField
                value={input}
                onChange={(event) => setInput(event.target.value)}
                multiline
                minRows={2}
                maxRows={6}
                fullWidth
                placeholder="Ask a question about weak areas, recommendations, or next actions..."
                sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={assistantMutation.isPending || !input.trim()}
                startIcon={<Send size={15} />}
                sx={{ minWidth: { xs: '100%', sm: 120 }, py: { xs: 1, sm: 'auto' } }}
              >
                Send
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Stack>
  )
}
