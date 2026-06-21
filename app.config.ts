export default {
  name: 'GramSeva',
  slug: 'gramseva',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'gramseva',
  userInterfaceStyle: 'dark',
  splash: {
    backgroundColor: '#0A0E1A',
    resizeMode: 'contain',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.gramseva.app',
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#0A0E1A',
    },
    package: 'com.gramseva.app',
    sms: true,
  },
  web: {
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-secure-store',
  ],
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
};
