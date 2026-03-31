import { Outlet } from 'react-router-dom'
import { Box } from '@mui/material'
import { FloatingAssistantWidget } from '../components/assistant/FloatingAssistantWidget'
import { GlobalNavbar } from '../components/navigation/GlobalNavbar'

export const AppShell = () => {
  return (
    <Box sx={{ width: '100%', minHeight: '100vh', px: { xs: 1.5, md: 2.5, lg: 3.5 }, py: { xs: 1.25, md: 2 } }}>
      <Box sx={{ maxWidth: '1540px', mx: 'auto' }}>
        <GlobalNavbar mode="app" />
        <Box component="main" className="page-enter" sx={{ mt: 2.4, mx: 'auto', width: '100%', minHeight: '78vh' }}>
          <Outlet />
        </Box>
      </Box>
      <FloatingAssistantWidget />
    </Box>
  )
}
