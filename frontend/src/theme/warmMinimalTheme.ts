import { alpha, createTheme } from '@mui/material/styles'

export const warmMinimalTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2f6f67',
      light: '#5f9c93',
      dark: '#204f49',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#cc7a45',
      light: '#e3a176',
      dark: '#9e5b31',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f9f4ed',
      paper: '#fffdfa',
    },
    text: {
      primary: '#1e2a38',
      secondary: '#5f6f82',
    },
    divider: '#e7ddd0',
  },
  typography: {
    fontFamily: 'Manrope, sans-serif',
    h1: { fontFamily: 'Sora, sans-serif', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.02em' },
    h2: { fontFamily: 'Sora, sans-serif', fontWeight: 700, lineHeight: 1.12, letterSpacing: '-0.01em' },
    h3: { fontFamily: 'Sora, sans-serif', fontWeight: 700, lineHeight: 1.14, letterSpacing: '-0.005em' },
    h4: { fontFamily: 'Sora, sans-serif', fontWeight: 700, lineHeight: 1.2, letterSpacing: '0em' },
    h5: { fontFamily: 'Sora, sans-serif', fontWeight: 700, lineHeight: 1.22 },
    h6: { fontFamily: 'Sora, sans-serif', fontWeight: 600, lineHeight: 1.24 },
    body1: { lineHeight: 1.6, fontSize: '1rem' },
    body2: { lineHeight: 1.6, fontSize: '0.875rem' },
    button: {
      textTransform: 'none',
      fontWeight: 700,
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            'radial-gradient(circle at 10% 8%, rgba(234, 175, 132, 0.24), transparent 28%), radial-gradient(circle at 86% 8%, rgba(47, 111, 103, 0.16), transparent 30%), linear-gradient(140deg, #fdf5eb 0%, #f6f6ef 48%, #f1f8f7 100%)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          transition: 'box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          paddingInline: 16,
          boxShadow: 'none',
          height: 44,
          fontSize: '0.95rem',
          transition: 'all 0.2s ease',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
        sizeMedium: {
          minHeight: 44,
          paddingInline: 20,
        },
        sizeSmall: {
          minHeight: 36,
          paddingInline: 14,
          fontSize: '0.9rem',
        },
        sizeLarge: {
          minHeight: 48,
          paddingInline: 24,
          fontSize: '1rem',
        },
        containedPrimary: {
          '&:hover': {
            boxShadow: `0 12px 24px ${alpha('#2f6f67', 0.25)}`,
            transform: 'translateY(-2px)',
          },
        },
        outlined: {
          borderWidth: 1.5,
          '&:hover': {
            borderWidth: 1.5,
            backgroundColor: alpha('#2f6f67', 0.04),
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #ece3d8',
          boxShadow: '0 8px 24px rgba(55, 72, 89, 0.08)',
          overflow: 'hidden',
          '&:hover': {
            boxShadow: '0 14px 28px rgba(36, 61, 88, 0.12)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },
  },
})
