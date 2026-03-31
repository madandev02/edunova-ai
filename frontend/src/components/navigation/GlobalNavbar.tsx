import { Bot, ChartColumnIncreasing, CreditCard, Home, LayoutDashboard, Library, LogOut, Menu, Route, ShieldCheck, User, UserCircle2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Box, Button, Drawer, Paper, Stack, Typography, IconButton } from '@mui/material'
import { useAuth } from '../../features/auth/AuthProvider'
import type { UserRole } from '../../types/api'

type AppNavLink = {
  to: string
  label: string
  icon: typeof Home
  roles?: UserRole[]
}

const appLinks: AppNavLink[] = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/courses', label: 'Courses', icon: Library },
  { to: '/app/learning-path', label: 'Learning Path', icon: Route, roles: ['student'] },
  { to: '/app/analytics', label: 'Analytics', icon: ChartColumnIncreasing, roles: ['student'] },
  { to: '/app/instructor/courses', label: 'My Courses', icon: Library, roles: ['instructor'] },
  { to: '/app/admin/billing-events', label: 'Billing Ops', icon: ShieldCheck, roles: ['admin'] },
  { to: '/app/content-audit', label: 'Content Audit', icon: ChartColumnIncreasing, roles: ['admin', 'instructor'] },
  { to: '/app/assistant', label: 'Assistant', icon: Bot },
]

const getRoleDashboardPath = (role: string | undefined) => {
  if (role === 'admin') {
    return '/app/admin/dashboard'
  }

  if (role === 'instructor') {
    return '/app/instructor/dashboard'
  }

  return '/app/student/dashboard'
}

const publicLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/#course-preview', label: 'Catalog', icon: Library },
  { href: '/pricing', label: 'Pricing', icon: ChartColumnIncreasing },
]

interface GlobalNavbarProps {
  compact?: boolean
  mode?: 'public' | 'app'
}

export const GlobalNavbar = ({ compact = false, mode }: GlobalNavbarProps) => {
  const { isAuthenticated, user, clearSession } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const effectiveMode = mode ?? (isAuthenticated ? 'app' : 'public')
  const dashboardPath = getRoleDashboardPath(user?.role)
  const effectiveRole: UserRole = user?.role ?? 'student'
  const visibleAppLinks = appLinks
    .filter((link) => !link.roles || link.roles.includes(effectiveRole))
    .map((link) => (link.to === '/app/dashboard' ? { ...link, to: dashboardPath } : link))

  const activePublicHref = location.pathname === '/' && location.hash
    ? `/${location.hash}`
    : location.pathname

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current) {
        return
      }
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
    setMenuOpen(false)
  }, [location.pathname, location.hash])

  const canAccessContentAudit = effectiveRole === 'admin' || effectiveRole === 'instructor'
  const dashboardButtonPath = isAuthenticated ? dashboardPath : '/app/dashboard'

  return (
    <Box component="header" data-testid="global-navbar" sx={{ position: 'sticky', top: 0, zIndex: 60 }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'rgba(188, 170, 152, 0.42)',
          bgcolor: 'rgba(255, 252, 247, 0.92)',
          px: { xs: 1.6, sm: 2.2 },
          py: compact ? 1 : 1.15,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 10px 20px rgba(34, 56, 73, 0.1)',
          borderBottomWidth: 2,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ minHeight: compact ? 48 : 52 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
            <Box
              component={Link}
              to="/"
              sx={{
                textDecoration: 'none',
                color: 'primary.main',
                display: 'inline-flex',
                alignItems: 'baseline',
                gap: 0.8,
              }}
            >
              <Typography sx={{ fontSize: { xs: 18, sm: 20 }, lineHeight: 1, fontFamily: 'Sora, sans-serif', fontWeight: 700, letterSpacing: '0.08em' }}>
                EDUNOVA
              </Typography>
              <Typography sx={{ display: { xs: 'none', sm: 'inline' }, fontSize: 11, letterSpacing: '0.12em', color: 'text.secondary', fontWeight: 700 }}>
                AI
              </Typography>
            </Box>
          </Box>

          {effectiveMode === 'public' ? (
            <>
              <Stack
                direction="row"
                spacing={0.6}
                sx={{
                  flex: 1,
                  justifyContent: 'center',
                  minWidth: 0,
                  display: { xs: 'none', md: 'flex' },
                }}
              >
                {publicLinks.map(({ href, label, icon: Icon }) => {
                  const isActive = activePublicHref === href
                  return (
                    <Button
                      key={href}
                      component="a"
                      href={href}
                      startIcon={<Icon size={14} />}
                      variant={isActive ? 'contained' : 'text'}
                      color={isActive ? 'primary' : 'inherit'}
                      sx={{
                        px: 1.6,
                        py: 0.95,
                        height: 40,
                        borderRadius: 2.5,
                        minWidth: 96,
                        fontSize: 14,
                        fontWeight: 700,
                        border: isActive ? 'none' : '1px solid',
                        borderColor: isActive ? 'transparent' : 'rgba(174, 162, 148, 0.52)',
                        bgcolor: isActive ? 'primary.main' : 'transparent',
                        color: isActive ? 'primary.contrastText' : 'text.primary',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: isActive ? 'primary.dark' : 'rgba(47, 111, 103, 0.06)',
                        },
                      }}
                    >
                      {label}
                    </Button>
                  )
                })}
              </Stack>
              <IconButton onClick={() => setMobileMenuOpen(true)} size="small" sx={{ display: { xs: 'flex', md: 'none' }, ml: 'auto' }}>
                <Menu size={20} />
              </IconButton>
            </>
          ) : (
            <>
              <Stack
                direction="row"
                spacing={0.55}
                sx={{
                  flex: 1,
                  justifyContent: 'center',
                  minWidth: 0,
                  overflowX: 'hidden',
                  display: { xs: 'none', md: 'flex' },
                }}
              >
                {visibleAppLinks.map(({ to, label, icon: Icon }) => (
                  <NavLink key={to} to={to} style={{ minWidth: 'fit-content', textDecoration: 'none' }}>
                    {({ isActive }) => (
                      <Button
                        variant={isActive ? 'contained' : 'text'}
                        color={isActive ? 'primary' : 'inherit'}
                        startIcon={<Icon size={14} />}
                        sx={{
                          px: 1.15,
                          py: 0.95,
                          height: 40,
                          borderRadius: 2.5,
                          fontSize: 13,
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          border: isActive ? 'none' : '1px solid',
                          borderColor: isActive ? 'transparent' : 'rgba(174, 162, 148, 0.52)',
                          bgcolor: isActive ? 'primary.main' : 'transparent',
                          color: isActive ? 'primary.contrastText' : 'text.primary',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: isActive ? 'primary.dark' : 'rgba(47, 111, 103, 0.06)',
                          },
                        }}
                      >
                        {label}
                      </Button>
                    )}
                  </NavLink>
                ))}
              </Stack>
              <IconButton onClick={() => setMobileMenuOpen(true)} size="small" sx={{ display: { xs: 'flex', md: 'none' }, ml: 'auto' }}>
                <Menu size={20} />
              </IconButton>
            </>
          )}

          <Drawer
            anchor="top"
            open={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': {
                mt: compact ? 6 : 6.5,
                borderRadius: '0 0 16px 16px',
                bgcolor: 'rgba(255, 252, 247, 0.98)',
                backdropFilter: 'blur(12px)',
              },
            }}
          >
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <IconButton onClick={() => setMobileMenuOpen(false)} size="small">
                  <X size={20} />
                </IconButton>
              </Box>
              <Stack spacing={0.5}>
                {(effectiveMode === 'public' ? publicLinks : visibleAppLinks).map((link) => {
                  const isNavLink = 'to' in link
                  const href = isNavLink ? link.to : link.href
                  const target = isNavLink ? link.to : href
                  const Icon = link.icon
                  const isActive = isNavLink
                    ? location.pathname === target
                    : activePublicHref === href

                  return (
                    <Button
                      key={href}
                      component={isNavLink ? NavLink : 'a'}
                      to={isNavLink ? target : undefined}
                      href={!isNavLink ? target : undefined}
                      onClick={() => setMobileMenuOpen(false)}
                      fullWidth
                      variant={isActive ? 'contained' : 'text'}
                      color={isActive ? 'primary' : 'inherit'}
                      startIcon={<Icon size={16} />}
                      sx={{
                        justifyContent: 'flex-start',
                        px: 2,
                        py: 1.2,
                        borderRadius: 2,
                        fontWeight: 700,
                        transition: 'all 0.2s ease',
                        bgcolor: isActive ? 'primary.main' : 'transparent',
                        color: isActive ? 'primary.contrastText' : 'text.primary',
                        '&:hover': {
                          backgroundColor: isActive ? 'primary.dark' : 'rgba(47, 111, 103, 0.08)',
                        },
                      }}
                    >
                      {link.label}
                    </Button>
                  )
                })}

                {effectiveMode === 'app' ? (
                  <>
                    <Button
                      component={Link}
                      to="/pricing"
                      onClick={() => setMobileMenuOpen(false)}
                      fullWidth
                      variant="text"
                      color="inherit"
                      startIcon={<CreditCard size={16} />}
                      sx={{ justifyContent: 'flex-start', px: 2, py: 1.2, borderRadius: 2, fontWeight: 700 }}
                    >
                      Billing
                    </Button>
                    <Button
                      component={Link}
                      to="/app/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      fullWidth
                      variant="text"
                      color="inherit"
                      startIcon={<UserCircle2 size={16} />}
                      sx={{ justifyContent: 'flex-start', px: 2, py: 1.2, borderRadius: 2, fontWeight: 700 }}
                    >
                      Profile
                    </Button>
                    <Button
                      onClick={() => {
                        setMobileMenuOpen(false)
                        clearSession()
                      }}
                      fullWidth
                      variant="text"
                      color="error"
                      startIcon={<LogOut size={16} />}
                      sx={{ justifyContent: 'flex-start', px: 2, py: 1.2, borderRadius: 2, fontWeight: 700 }}
                    >
                      Logout
                    </Button>
                  </>
                ) : null}
              </Stack>
            </Box>
          </Drawer>

          {isAuthenticated && effectiveMode === 'app' ? (
            <Box ref={menuRef} sx={{ position: 'relative', ml: 'auto', flexShrink: 0 }}>
              <Button
                type="button"
                variant="outlined"
                color="inherit"
                onClick={() => setMenuOpen((previous) => !previous)}
                startIcon={<User size={14} />}
                size="small"
                sx={{
                  borderColor: 'rgba(171, 160, 146, 0.52)',
                  color: 'text.primary',
                  borderRadius: 2.5,
                  px: 1.4,
                  height: 40,
                  minWidth: 0,
                  maxWidth: { xs: 170, sm: 220 },
                  bgcolor: 'rgba(255,255,255,0.72)',
                  fontWeight: 700,
                }}
              >
                <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: { xs: 110, sm: 165 }, fontSize: '0.9rem' }}>
                  {user?.email ?? 'Learner'}
                </Box>
              </Button>

              {menuOpen ? (
                <Paper
                  elevation={0}
                  sx={{
                    position: 'absolute',
                    right: 0,
                    mt: 1,
                    width: 240,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    p: 1,
                    bgcolor: 'rgba(255,255,255,0.96)',
                    boxShadow: '0 14px 24px rgba(38, 59, 73, 0.14)',
                  }}
                >
                  <Button
                    fullWidth
                    component={Link}
                    to="/app/profile"
                    onClick={() => setMenuOpen(false)}
                    startIcon={<UserCircle2 size={14} />}
                    sx={{ justifyContent: 'flex-start', color: 'text.primary', mb: 0.5, borderRadius: 2 }}
                  >
                    Profile settings
                  </Button>

                  <Button
                    fullWidth
                    component={Link}
                    to="/pricing"
                    onClick={() => setMenuOpen(false)}
                    startIcon={<CreditCard size={14} />}
                    sx={{ justifyContent: 'flex-start', color: 'text.primary', mb: 0.5, borderRadius: 2 }}
                  >
                    Billing
                  </Button>

                  {canAccessContentAudit ? (
                  <Button
                    fullWidth
                    component={Link}
                    to="/app/content-audit"
                    onClick={() => setMenuOpen(false)}
                    startIcon={<ChartColumnIncreasing size={14} />}
                    sx={{ justifyContent: 'flex-start', color: 'text.primary', mb: 0.5, borderRadius: 2 }}
                  >
                    Content audit
                  </Button>
                  ) : null}

                  <Button
                    fullWidth
                    onClick={() => {
                      setMenuOpen(false)
                      clearSession()
                    }}
                    startIcon={<LogOut size={14} />}
                    sx={{ justifyContent: 'flex-start', color: 'error.main', borderRadius: 2 }}
                  >
                    Logout
                  </Button>
                </Paper>
              ) : null}
            </Box>
          ) : (
            <Stack direction="row" spacing={1} sx={{ ml: 'auto', flexShrink: 0 }} alignItems="center">
              {isAuthenticated ? (
                <Button component={Link} to={dashboardButtonPath} variant="contained" color="primary" size="small" sx={{ borderRadius: 2.5, px: 2, height: 40, fontWeight: 700 }}>
                  Open app
                </Button>
              ) : (
                <>
                  <Button component={Link} to="/login" variant="outlined" color="primary" size="small" sx={{ borderRadius: 2.5, px: 1.8, height: 40, fontWeight: 700 }}>
                    Log in
                  </Button>
                  <Button component={Link} to="/register" variant="contained" color="primary" size="small" sx={{ borderRadius: 2.5, px: 2, height: 40, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    Get started
                  </Button>
                </>
              )}
            </Stack>
          )}
        </Stack>

      </Paper>
    </Box>
  )
}
