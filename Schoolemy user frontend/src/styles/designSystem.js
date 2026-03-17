// Modern Design System with Natural Colors and Typography
export const designSystem = {
  // Natural Color Palette
  colors: {
    // Primary Colors - Natural Blues and Greens
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9', // Main primary
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    
    // Secondary Colors - Natural Greens
    secondary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e', // Main secondary
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    
    // Accent Colors - Warm Natural Tones
    accent: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b', // Main accent
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    
    // Neutral Colors - Warm Grays
    neutral: {
      0: '#ffffff',
      50: '#fafaf9',
      100: '#f5f5f4',
      200: '#e7e5e4',
      300: '#d6d3d1',
      400: '#a8a29e',
      500: '#78716c',
      600: '#57534e',
      700: '#44403c',
      800: '#292524',
      900: '#1c1917',
      950: '#0c0a09',
    },
    
    // Semantic Colors
    success: {
      light: '#d1fae5',
      main: '#10b981',
      dark: '#047857',
    },
    warning: {
      light: '#fef3c7',
      main: '#f59e0b',
      dark: '#d97706',
    },
    error: {
      light: '#fee2e2',
      main: '#ef4444',
      dark: '#dc2626',
    },
    info: {
      light: '#dbeafe',
      main: '#3b82f6',
      dark: '#1d4ed8',
    },
    
    // Background Colors
    background: {
      primary: '#f0ece6',
      secondary: '#fafaf9',
      tertiary: '#f5f5f4',
      dark: '#1c1917',
      glass: 'rgba(255, 255, 255, 0.8)',
      overlay: 'rgba(0, 0, 0, 0.4)',
    },
    
    // Text Colors
    text: {
      primary: '#1c1917',
      secondary: '#44403c',
      tertiary: '#78716c',
      inverse: '#ffffff',
      muted: '#a8a29e',
    },
    
    // Gradients
    gradients: {
      primary: 'linear-gradient(135deg, #0ea5e9 0%, #22c55e 100%)',
      secondary: 'linear-gradient(135deg, #22c55e 0%, #f59e0b 100%)',
      accent: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
      glass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
      hero: 'linear-gradient(135deg, rgba(14, 165, 233, 0.9) 0%, rgba(34, 197, 94, 0.8) 50%, rgba(245, 158, 11, 0.9) 100%)',
    },
  },
  
  // Typography System
  typography: {
    // Font Families
    fonts: {
      primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
      secondary: "'Playfair Display', 'Georgia', 'Times New Roman', serif",
      accent: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
      mono: "'Fira Code', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace",
    },
    
    // Font Sizes (using clamp for responsive)
    size: {
      xs: 'clamp(0.75rem, 0.8vw, 0.875rem)',
      sm: 'clamp(0.875rem, 1vw, 1rem)',
      base: 'clamp(1rem, 1.2vw, 1.125rem)',
      lg: 'clamp(1.125rem, 1.4vw, 1.25rem)',
      xl: 'clamp(1.25rem, 1.6vw, 1.5rem)',
      '2xl': 'clamp(1.5rem, 2vw, 1.875rem)',
      '3xl': 'clamp(1.875rem, 2.5vw, 2.25rem)',
      '4xl': 'clamp(2.25rem, 3vw, 3rem)',
      '5xl': 'clamp(3rem, 4vw, 4rem)',
      '6xl': 'clamp(4rem, 5vw, 5rem)',
    },
    
    // Font Weights
    weight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },
    
    // Line Heights
    lineHeight: {
      tight: 1.2,
      snug: 1.3,
      normal: 1.5,
      relaxed: 1.6,
      loose: 1.8,
    },
    
    // Letter Spacing
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },
  
  // Spacing System (8px base)
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
    32: '8rem',     // 128px
    40: '10rem',    // 160px
    48: '12rem',    // 192px
    56: '14rem',    // 224px
    64: '16rem',    // 256px
  },
  
  // Border Radius
  borderRadius: {
    none: '0',
    xs: '0.125rem',   // 2px
    sm: '0.25rem',    // 4px
    base: '0.375rem', // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    '3xl': '2rem',    // 32px
    full: '9999px',
  },
  
  // Shadows
  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '2xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    glow: '0 0 20px rgba(14, 165, 233, 0.4)',
    glowHover: '0 0 40px rgba(14, 165, 233, 0.6)',
  },
  
  // Breakpoints
  breakpoints: {
    xs: '475px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // Z-Index Scale
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },
  
  // Transitions
  transitions: {
    fast: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    base: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    bounce: 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  
  // Component Styles
  components: {
    button: {
      sizes: {
        xs: {
          padding: '0.5rem 0.75rem',
          fontSize: 'clamp(0.75rem, 0.8vw, 0.875rem)',
          borderRadius: '0.375rem',
        },
        sm: {
          padding: '0.75rem 1rem',
          fontSize: 'clamp(0.875rem, 1vw, 1rem)',
          borderRadius: '0.5rem',
        },
        base: {
          padding: '1rem 1.5rem',
          fontSize: 'clamp(1rem, 1.2vw, 1.125rem)',
          borderRadius: '0.75rem',
        },
        lg: {
          padding: '1.25rem 2rem',
          fontSize: 'clamp(1.125rem, 1.4vw, 1.25rem)',
          borderRadius: '1rem',
        },
      },
    },
    card: {
      padding: {
        sm: '1rem',
        base: '1.5rem',
        lg: '2rem',
        xl: '3rem',
      },
      borderRadius: '1rem',
      shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    },
  },
  
  // Animation keyframes
  animations: {
    float: `
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
      }
    `,
    pulse: `
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.8; }
      }
    `,
    shimmer: `
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `,
    slideUp: `
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(60px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `,
    fadeInScale: `
      @keyframes fadeInScale {
        from { opacity: 0; transform: scale(0.8); }
        to { opacity: 1; transform: scale(1); }
      }
    `,
  },
};

// CSS Custom Properties Generator
export const generateCSSVariables = (theme = designSystem) => {
  const cssVars = {};
  
  // Colors
  Object.entries(theme.colors).forEach(([key, value]) => {
    if (typeof value === 'object') {
      Object.entries(value).forEach(([subKey, subValue]) => {
        cssVars[`--color-${key}-${subKey}`] = subValue;
      });
    } else {
      cssVars[`--color-${key}`] = value;
    }
  });
  
  // Typography
  Object.entries(theme.typography.fonts).forEach(([key, value]) => {
    cssVars[`--font-${key}`] = value;
  });
  
  Object.entries(theme.typography.size).forEach(([key, value]) => {
    cssVars[`--text-${key}`] = value;
  });
  
  // Spacing
  Object.entries(theme.spacing).forEach(([key, value]) => {
    cssVars[`--spacing-${key}`] = value;
  });
  
  // Shadows
  Object.entries(theme.shadows).forEach(([key, value]) => {
    cssVars[`--shadow-${key}`] = value;
  });
  
  // Border Radius
  Object.entries(theme.borderRadius).forEach(([key, value]) => {
    cssVars[`--radius-${key}`] = value;
  });
  
  // Transitions
  Object.entries(theme.transitions).forEach(([key, value]) => {
    cssVars[`--transition-${key}`] = value;
  });
  
  return cssVars;
};

// Utility functions
export const mediaQuery = (breakpoint) => `@media (min-width: ${designSystem.breakpoints[breakpoint]})`;

export const getColor = (color, shade = 500) => {
  if (typeof designSystem.colors[color] === 'string') {
    return designSystem.colors[color];
  }
  return designSystem.colors[color]?.[shade] || designSystem.colors.neutral[500];
};

export const getSpacing = (size) => designSystem.spacing[size] || size;

export const getShadow = (size) => designSystem.shadows[size] || designSystem.shadows.base;

export default designSystem; 