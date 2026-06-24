export default {
  name: 'GramSeva',
  slug: 'gramseva',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'gramseva',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/images/splash.png',
    backgroundColor: '#0A0E1A',
    resizeMode: 'contain',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.gramseva.app',
    buildNumber: '1',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#0A0E1A',
    },
    package: 'com.gramseva.app',
    versionCode: 1,
    sms: true,
    permissions: ['android.permission.SEND_SMS'],
  },
  web: {
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-secure-store',
    [
      'expo-build-properties',
      {
        android: {
          permissions: ['android.permission.SEND_SMS'],
        },
      },
    ],
    './plugins/withSendSms',
  ],
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    eas: {
      projectId: 'fa2e94ff-9d77-48ec-86ec-abc7737a16e6',
    },
  },
};