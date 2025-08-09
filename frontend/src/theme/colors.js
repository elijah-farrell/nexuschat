// NexusChat Color Theme - Telegram-inspired Clean Design
export const colors = {
  // Light Mode - Clean and Spacious
  light: {
    background: {
      primary: '#FFFFFF',   // Pure white - fresh and spacious
      secondary: '#F4F4F5', // Soft gray - separates content naturally
    },
    text: {
      primary: '#1F1F1F',   // Almost black - reduces eye strain
      secondary: '#606060', // Medium gray - non-critical info
    }
  },
  
  // Dark Mode - Comfortable Night Use
  dark: {
    background: {
      primary: '#1E1F22',   // Very dark grey - not pure black
      secondary: '#2C2F33', // Muted charcoal - separates with depth
    },
    text: {
      primary: '#FFFFFF',   // White - clear on dark
      secondary: '#B9BBBE', // Light grey - reduces glare
    }
  },
  
  // Universal Colors - Same in Both Modes
  accent: '#3B82F6',      // Bright blue - buttons, links, active states
  accentHover: '#2563EB', // Darker blue for hover
  
  // Status Colors - Universal Recognition
  success: '#10B981',     // Green - slightly brighter for dark mode
  warning: '#F59E0B',     // Amber - pops on both backgrounds  
  error: '#EF4444',       // Red - clear danger indication
  
  // Helper function to get colors based on mode
  getColors: (mode) => ({
    bg: {
      primary: mode === 'dark' ? colors.dark.background.primary : colors.light.background.primary,
      secondary: mode === 'dark' ? colors.dark.background.secondary : colors.light.background.secondary,
    },
    text: {
      primary: mode === 'dark' ? colors.dark.text.primary : colors.light.text.primary,
      secondary: mode === 'dark' ? colors.dark.text.secondary : colors.light.text.secondary,
    },
    accent: colors.accent,
    accentHover: colors.accentHover,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
  })
};

// Simple gradients for modern clean design
export const gradients = {
  // Subtle gradients that maintain the clean aesthetic
  accent: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentHover} 100%)`,
  light: `linear-gradient(135deg, ${colors.light.background.primary} 0%, ${colors.light.background.secondary} 100%)`,
  dark: `linear-gradient(135deg, ${colors.dark.background.primary} 0%, ${colors.dark.background.secondary} 100%)`,
};
