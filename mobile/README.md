# BreezeChat Mobile (React Native)

This is an Expo-based React Native app scaffold for Android (and iOS/web). It’s isolated in the `mobile/` folder so it won’t interfere with your Next.js app.

## Prerequisites
- Node.js 18+
- Expo CLI (installed automatically via npm scripts)
- Android Studio / Android SDK and an emulator, or a physical Android device

## Getting started

```pwsh
cd mobile
npm install
npm run android
```

- `npm run android` builds and runs the native app on an Android emulator/device.
- You can also run `npm start` (Expo Dev) and then press `a` for Android.

## Next steps
- Add Firebase for mobile: `npm i firebase`, then reuse config from the web app (NEXT_PUBLIC_* values map to RN env via a config module).
- Implement chat UI and calling features with React Native components and `react-native-webrtc` or a hosted SDK.
- Share logic by moving common utilities to a `shared/` package or plain `src/shared/` folder.
