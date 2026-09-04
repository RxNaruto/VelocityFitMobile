import { TextStyle } from 'react-native';
import { colors } from './colors';

export const typography = {
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  } satisfies TextStyle,
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  } satisfies TextStyle,
  subheading: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  } satisfies TextStyle,
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 22,
  } satisfies TextStyle,
  bodyMuted: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textMuted,
    lineHeight: 22,
  } satisfies TextStyle,
  caption: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  } satisfies TextStyle,
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  } satisfies TextStyle,
  brand: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 2.5,
  } satisfies TextStyle,
} as const;
