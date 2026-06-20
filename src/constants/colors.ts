export const colors = {
  background: '#0A0E1A',
  surface: 'rgba(255,255,255,0.07)',
  surfaceBorder: 'rgba(255,255,255,0.12)',
  primary: '#6C63FF',
  secondary: '#00D4AA',
  warning: '#F5A623',
  danger: '#FF4D6D',
  textPrimary: '#F0F0F0',
  textMuted: '#8A8FA8',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0,0,0,0.6)',
  glassBorder: 'rgba(255,255,255,0.12)',
  inputBackground: 'rgba(255,255,255,0.05)',
  inputFocusGlow: 'rgba(108,99,255,0.3)',
} as const;

export type ColorKey = keyof typeof colors;
