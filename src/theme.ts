import { Platform, ViewStyle } from 'react-native';

export const colors = {
  primary: '#F97316',
  primaryDark: '#EA580C',
  primarySoft: '#FFF1E6',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  divider: '#EEF1F5',
  text: '#0F172A',
  textMuted: '#64748B',
  textFaint: '#94A3B8',
  chip: '#F1F5F9',
  danger: '#EF4444',
  success: '#16A34A',
};

export const radius = { sm: 10, md: 14, lg: 20, pill: 999 };

export const shadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  default: { elevation: 3, shadowColor: '#0F172A' },
}) as ViewStyle;
