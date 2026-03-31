import { Crown, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material'

interface UpgradeRequiredStateProps {
  title?: string
  description?: string
}

export const UpgradeRequiredState = ({
  title = 'Upgrade required',
  description = 'This feature is available on Pro and Premium plans. Upgrade to continue.',
}: UpgradeRequiredStateProps) => {
  return (
    <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'rgba(255,255,255,0.8)' }}>
      <CardContent sx={{ p: { xs: 2.4, md: 3 } }}>
        <Stack spacing={1.4}>
          <Chip icon={<Lock size={14} />} label="Premium access" sx={{ width: 'fit-content', bgcolor: '#fff4ec', color: '#9e5b31' }} />
          <Typography variant="h5">{title}</Typography>
          <Typography sx={{ color: 'text.secondary', maxWidth: 680 }}>{description}</Typography>

          <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap', mt: 0.8 }}>
            <Button component={Link} to="/pricing" variant="contained" startIcon={<Crown size={14} />} sx={{ px: 2, py: 1, whiteSpace: 'nowrap' }}>
              View plans and checkout
            </Button>
            <Button component={Link} to="/app/courses" variant="outlined" sx={{ px: 2, py: 1, whiteSpace: 'nowrap' }}>
              Back to courses
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}
