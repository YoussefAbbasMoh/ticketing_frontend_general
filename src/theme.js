import { createTheme } from '@mui/material/styles';
import { colors, radii, typography } from './theme/designTokens.js';

/** Shared MUI options; pass `direction` so icons and layout mirror with `document.dir`. */
const themeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: colors.primary,
      contrastText: colors.onPrimary,
    },
    secondary: {
      main: colors.secondary,
      contrastText: colors.onSecondary,
    },
    background: {
      default: colors.background,
      paper: colors.surface,
    },
    text: {
      primary: colors.text,
      secondary: colors.textSecondary,
      disabled: colors.disabledText,
    },
    divider: colors.divider,
    success: { main: colors.success },
    warning: { main: colors.warning },
    error: { main: colors.error },
    info: { main: colors.info },
    action: {
      disabled: colors.disabled,
      disabledBackground: colors.surfaceVariant,
    },
  },
  shape: {
    borderRadius: radii.input,
  },
  typography: {
    fontFamily: typography.fontFamily,
    h1: {
      fontSize: `${typography.displayLarge.fontSize}px`,
      fontWeight: typography.displayLarge.fontWeight,
      color: colors.text,
    },
    h2: {
      fontSize: `${typography.headlineMedium.fontSize}px`,
      fontWeight: typography.headlineMedium.fontWeight,
      color: colors.text,
    },
    h3: {
      fontSize: `${typography.titleMedium.fontSize}px`,
      fontWeight: typography.titleMedium.fontWeight,
      color: colors.text,
    },
    h4: {
      fontSize: `${typography.titleMedium.fontSize}px`,
      fontWeight: 600,
      color: colors.text,
    },
    h5: {
      fontSize: `${typography.bodyLarge.fontSize}px`,
      fontWeight: 600,
      color: colors.text,
    },
    h6: {
      fontSize: `${typography.bodyLarge.fontSize}px`,
      fontWeight: 600,
      color: colors.text,
    },
    body1: {
      fontSize: `${typography.bodyLarge.fontSize}px`,
      fontWeight: typography.bodyLarge.fontWeight,
      color: colors.text,
    },
    body2: {
      fontSize: `${typography.bodyMedium.fontSize}px`,
      fontWeight: typography.bodyMedium.fontWeight,
      color: colors.textSecondary,
    },
    button: {
      fontSize: `${typography.labelLarge.fontSize}px`,
      fontWeight: typography.labelLarge.fontWeight,
      textTransform: 'none',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.background,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: colors.background,
          color: colors.text,
          boxShadow: 'none',
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: radii.button,
          fontWeight: typography.labelLarge.fontWeight,
          minHeight: 40,
        },
        containedPrimary: {
          backgroundColor: colors.primary,
          color: colors.onPrimary,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
            backgroundColor: colors.primarySoft,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: radii.card,
          boxShadow: '0 2px 12px rgba(8, 9, 54, 0.102), 0 1px 2px rgba(15, 23, 42, 0.06)',
          border: `1px solid ${colors.divider}`,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: radii.input,
            backgroundColor: colors.surface,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& fieldset': {
            borderColor: colors.border,
          },
          '&:hover fieldset': {
            borderColor: colors.textTertiary,
          },
          '&.Mui-focused fieldset': {
            borderColor: colors.primary,
          },
        },
      },
    },
  },
};

export function createAppTheme(direction = 'ltr') {
  return createTheme({
    direction,
    ...themeOptions,
  });
}

const theme = createAppTheme('ltr');
export default theme;
