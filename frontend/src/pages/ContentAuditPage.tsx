import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Box, Button, Card, CardContent, Chip, Grid, Paper, Stack, Typography } from '@mui/material'
import type { ContentAuditIssue } from '../types/api'
import { usePageTitle } from '../hooks/usePageTitle'
import { useContentAuditDetailsQuery, useContentAuditFixMutation } from '../features/content-audit/queries'

const issueTypes = ['all', 'video_mismatch', 'quiz_mismatch', 'structure_mismatch'] as const
const severities = ['all', 'high', 'medium', 'low'] as const

export const ContentAuditPage = () => {
  usePageTitle('Content Audit')

  const [selectedType, setSelectedType] = useState<(typeof issueTypes)[number]>('all')
  const [selectedSeverity, setSelectedSeverity] = useState<(typeof severities)[number]>('all')
  const [lastAction, setLastAction] = useState<'dry-run' | 'apply' | null>(null)

  const auditDetailsQuery = useContentAuditDetailsQuery()
  const auditFixMutation = useContentAuditFixMutation()

  const summary = auditDetailsQuery.data?.live_report.summary

  const filteredIssues = useMemo(() => {
    const issues = auditDetailsQuery.data?.live_report.issues ?? []
    return issues.filter((issue) => {
      const matchType = selectedType === 'all' ? true : issue.type === selectedType
      const matchSeverity = selectedSeverity === 'all' ? true : issue.severity === selectedSeverity
      return matchType && matchSeverity
    })
  }, [auditDetailsQuery.data, selectedSeverity, selectedType])

  const badgeColor = (severity: ContentAuditIssue['severity']) => {
    if (severity === 'high') {
      return { bg: '#fff1f0', color: '#b42318' }
    }
    if (severity === 'medium') {
      return { bg: '#fff7eb', color: '#b54708' }
    }
    return { bg: '#f6f7f9', color: '#475467' }
  }

  return (
    <Stack spacing={{ xs: 1.8, md: 2.2 }}>
      <Paper
        sx={{ borderRadius: 5, border: '1px solid', borderColor: 'divider', p: { xs: 1.8, md: 3 }, bgcolor: 'rgba(255,255,255,0.74)' }}
      >
        <Typography sx={{ fontSize: { xs: 10, sm: 12 }, textTransform: 'uppercase', letterSpacing: '0.11em', color: 'primary.main', fontWeight: 700 }}>
          Ops Console
        </Typography>
        <Typography variant="h4" sx={{ mt: 1.1, fontSize: { xs: '1.5rem', sm: '2rem' } }}>Content alignment audit</Typography>
        <Typography sx={{ mt: 1.2, color: 'text.secondary' }}>
          Verify that lesson, module, quiz, and video mappings remain coherent as content evolves.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ mt: 2 }}>
          <Button
            type="button"
            onClick={() => {
              setLastAction('dry-run')
              auditFixMutation.mutate(true)
            }}
            disabled={auditFixMutation.isPending}
            variant="outlined"
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            {auditFixMutation.isPending && lastAction === 'dry-run' ? 'Running dry run...' : 'Dry run auto-fix'}
          </Button>
          <Button
            type="button"
            onClick={() => {
              setLastAction('apply')
              auditFixMutation.mutate(false)
            }}
            disabled={auditFixMutation.isPending}
            variant="contained"
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            {auditFixMutation.isPending && lastAction === 'apply' ? 'Applying fixes...' : 'Apply fixes now'}
          </Button>
        </Stack>

        <Typography sx={{ mt: 1, fontSize: 13, color: 'text.secondary' }}>
          Dry run previews changes without writing to the database. Apply fixes updates mismatched lesson resources.
        </Typography>

        {auditFixMutation.data ? (
          <Paper variant="outlined" sx={{ mt: 1.6, borderRadius: 3, p: 1.4, bgcolor: '#fffdfa' }}>
            <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>
              {auditFixMutation.data.dry_run ? 'Dry run completed.' : 'Fixes applied successfully.'}
            </Typography>
            <Typography sx={{ mt: 0.6, color: 'text.secondary' }}>
              Proposed: {auditFixMutation.data.proposed_fixes_total} | Applied: {auditFixMutation.data.applied_fixes_total} | Non-fixable: {auditFixMutation.data.non_fixable_total}
            </Typography>
          </Paper>
        ) : null}

        {auditFixMutation.isError ? (
          <Paper sx={{ mt: 1.6, borderRadius: 3, p: 1.4, bgcolor: '#fff1f0', color: 'error.main' }}>
            Unable to run auto-fix. Please try again.
          </Paper>
        ) : null}
      </Paper>

      <Grid container spacing={{ xs: 1.2, md: 2 }}>
        <Grid size={{ xs: 12, xl: 3 }}>
          <Card sx={{ borderRadius: 4 }}>
            <CardContent sx={{ p: { xs: 1.8, md: 2.4 } }}>
              <Typography sx={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 700 }}>
                Filter by type
              </Typography>
              <Stack spacing={0.8} sx={{ mt: 1.2 }}>
                {issueTypes.map((type) => (
                  <Button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    variant={selectedType === type ? 'contained' : 'outlined'}
                    size="small"
                    sx={{ width: '100%' }}
                  >
                    {type}
                  </Button>
                ))}
              </Stack>

              <Typography sx={{ mt: 2, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 700 }}>
                Filter by severity
              </Typography>
              <Stack spacing={0.8} sx={{ mt: 1.2 }}>
                {severities.map((severity) => (
                  <Button
                    key={severity}
                    type="button"
                    onClick={() => setSelectedSeverity(severity)}
                    variant={selectedSeverity === severity ? 'contained' : 'outlined'}
                    size="small"
                    sx={{ width: '100%' }}
                  >
                    {severity}
                  </Button>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, xl: 9 }}>
          <Card sx={{ borderRadius: 4 }}>
            <CardContent sx={{ p: { xs: 1.8, md: 2.4 } }}>
              {auditDetailsQuery.isPending ? <Typography sx={{ color: 'text.secondary' }}>Loading audit details...</Typography> : null}
              {auditDetailsQuery.isError ? <Typography sx={{ color: 'error.main' }}>Unable to load audit details.</Typography> : null}

              {summary ? (
                <Grid container spacing={1} sx={{ mb: 1.5 }}>
                  <Grid size={{ xs: 6, md: 4, lg: 2 }}><Chip label={`Courses: ${summary.courses}`} variant="outlined" /></Grid>
                  <Grid size={{ xs: 6, md: 4, lg: 2 }}><Chip label={`Modules: ${summary.modules}`} variant="outlined" /></Grid>
                  <Grid size={{ xs: 6, md: 4, lg: 2 }}><Chip label={`Lessons: ${summary.lessons}`} variant="outlined" /></Grid>
                  <Grid size={{ xs: 6, md: 4, lg: 2 }}><Chip label={`Video: ${summary.video_mismatch}`} sx={{ bgcolor: '#fff7eb', color: '#b54708' }} /></Grid>
                  <Grid size={{ xs: 6, md: 4, lg: 2 }}><Chip label={`Quiz: ${summary.quiz_mismatch}`} sx={{ bgcolor: '#fff7eb', color: '#b54708' }} /></Grid>
                  <Grid size={{ xs: 6, md: 4, lg: 2 }}><Chip label={`Structure: ${summary.structure_mismatch}`} sx={{ bgcolor: '#fff1f0', color: '#b42318' }} /></Grid>
                </Grid>
              ) : null}

              <Stack spacing={1.2}>
                {filteredIssues.length === 0 ? (
                  <Paper sx={{ borderRadius: 3, p: 1.6, bgcolor: '#edf8f0', color: '#1b6f41' }}>
                    No issues for current filters. Content alignment is healthy.
                  </Paper>
                ) : (
                  filteredIssues.map((issue, index) => {
                    const colors = badgeColor(issue.severity)
                    return (
                      <Paper key={`${issue.type}-${issue.lesson_id ?? issue.module_id ?? issue.course_id ?? index}`} variant="outlined" sx={{ borderRadius: 3, p: 1.5, bgcolor: '#fffdfa' }}>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                          <Chip label={issue.severity} size="small" sx={{ bgcolor: colors.bg, color: colors.color }} />
                          <Chip label={issue.type} size="small" variant="outlined" />
                        </Stack>

                        <Typography sx={{ mt: 1, fontWeight: 700 }}>{issue.message}</Typography>
                        <Typography sx={{ mt: 0.6, fontSize: 13, color: 'text.secondary' }}>
                          {issue.course_title ? `Course: ${issue.course_title}` : ''}
                          {issue.module_title ? ` | Module: ${issue.module_title}` : ''}
                          {issue.lesson_title ? ` | Lesson: ${issue.lesson_title}` : ''}
                        </Typography>

                        {issue.expected_video_url || issue.actual_video_url ? (
                          <Paper variant="outlined" sx={{ mt: 1, borderRadius: 2, p: 1, bgcolor: '#f9f8f6' }}>
                            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Expected video: {issue.expected_video_url ?? 'N/A'}</Typography>
                            <Typography sx={{ mt: 0.3, fontSize: 12, color: 'text.secondary' }}>Actual video: {issue.actual_video_url ?? 'N/A'}</Typography>
                          </Paper>
                        ) : null}
                      </Paper>
                    )
                  })
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box>
        <Button component={Link} to="/app/profile" variant="text">Back to profile</Button>
      </Box>
    </Stack>
  )
}
