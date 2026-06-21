# GramSeva

A React Native (Expo) mobile application built for rural governance and community services.

## Tech Stack

- **Framework:** React Native with Expo SDK 51
- **Navigation:** React Navigation (native-stack + bottom-tabs)
- **State Management:** Redux Toolkit + React Redux
- **Backend:** Supabase
- **Forms:** React Hook Form + Zod
- **UI:** Custom dark theme with Poppins/Inter fonts

## Getting Started

```bash
npm install
npm start
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EAS_PROJECT_ID=
```

## Scripts

| Command         | Description                |
| --------------- | -------------------------- |
| `npm start`     | Start Expo dev server      |
| `npm run web`   | Start for web              |
| `npm run android` | Start for Android       |
| `npm run lint`  | Run ESLint                 |
| `npm run typecheck` | Run TypeScript check  |
