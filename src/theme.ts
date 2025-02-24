// theme.ts
import { createTheme } from '@mui/material/styles';

// Factory function that returns a custom theme based on the darkMode flag.
export const getTheme = (darkMode: boolean) =>
  createTheme({
    // Define the palette and switch between dark and light mode.
    palette: {
      mode: darkMode ? 'dark' : 'light',
      ...(darkMode
        ? {
            // Dark mode customizations
            primary: { main: '#90caf9' },
            secondary: { main: '#f48fb1' },
            background: {
              default: '#121212',
              paper: '#1d1d1d',
            },
            text: {
              primary: '#ffffff',
              secondary: '#b0bec5',
            },
          }
        : {
            // Light mode customizations
            primary: { main: '#1976d2' },
            secondary: { main: '#dc004e' },
            background: {
              default: '#f5f5f5',
              paper: '#ffffff',
            },
            text: {
              primary: '#000000',
              secondary: '#424242',
            },
          }),
    },
    // Customize typography for all text elements.
    typography: {
      body1: { fontSize: '1rem' },
      // Add more typography customizations as needed
    },
    // Override default styles and props for MUI components.
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none', // Prevent all caps
            borderRadius: 8, // Global border radius
            // Add further button styling here
          },
        },
        defaultProps: {
          disableRipple: true, // Optionally disable the ripple effect
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
             // Default padding for Paper components
            // Further paper customizations here
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
           // Space out text fields globally
            // More text field styling options
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
             // Remove default shadow
            // Customize AppBar background or height if needed
          },
        },
      },
      MuiContainer: {
        styleOverrides: {
          root: {
            padding: '24px', // Global container padding
            // Additional container overrides
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            // Customize typography globally if needed
            // For example: letterSpacing, margin, etc.
          },
        },
      },
      // Add overrides for any other MUI component as needed
    },
  });
