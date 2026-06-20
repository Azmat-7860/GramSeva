export const fonts = {
  poppins: {
    regular: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semibold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
  },
  inter: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
  },
  jetbrainsMono: {
    regular: 'JetBrainsMono_400Regular',
    medium: 'JetBrainsMono_500Medium',
  },
} as const;

export const typography = {
  displayLarge: {
    fontFamily: fonts.poppins.bold,
    fontSize: 32,
    lineHeight: 40,
  },
  displayMedium: {
    fontFamily: fonts.poppins.semibold,
    fontSize: 24,
    lineHeight: 32,
  },
  displaySmall: {
    fontFamily: fonts.poppins.semibold,
    fontSize: 20,
    lineHeight: 28,
  },
  heading: {
    fontFamily: fonts.poppins.semibold,
    fontSize: 18,
    lineHeight: 24,
  },
  subheading: {
    fontFamily: fonts.poppins.medium,
    fontSize: 16,
    lineHeight: 22,
  },
  body: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  bodyMedium: {
    fontFamily: fonts.inter.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fonts.inter.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  mono: {
    fontFamily: fonts.jetbrainsMono.regular,
    fontSize: 16,
    lineHeight: 22,
  },
  monoLarge: {
    fontFamily: fonts.jetbrainsMono.medium,
    fontSize: 24,
    lineHeight: 32,
  },
} as const;
