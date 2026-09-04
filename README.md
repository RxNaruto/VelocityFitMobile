# Velocity Fit — Mobile (Android)

Native Expo app for Velocity Fit. Workout logging, the exercise catalog, the leaderboard, and
profile stats run against the same REST API as the web app.

This is a standalone repository. The web app and API live in the separate `VelocityFit` repo; this
app only consumes the API over HTTP and shares no code with it.

## Scope

The app deliberately mirrors the **stable** web release feature-for-feature. It ships only what
that release exposes:

- Sign in / register
- Log and edit today's workout (reps × weight, time-based sets, drop sets, failure flags)
- Read-only history via the calendar and per-day view
- Exercise catalog management (muscle groups + exercises)
- Leaderboard and public profiles
- Profile stats (totals, streak, top exercises, weekly muscle groups)

Anything not in the stable web release — GPS run tracking, weekly workout plans, rest days,
treadmill/swim cardio metrics — is intentionally absent. The API surface in `src/services/api.ts`
matches `backend/src/routes/index.ts` of the stable release exactly.

## Requirements

- **Node.js** 18+
- **JDK 17** and the **Android SDK** (platform 36, build-tools 36)
  - Gradle reads `JAVA_HOME`, not `PATH`. If an older JDK is also installed, point it at 17 first:
    `$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot"`
- Backend API reachable from the device (see [API configuration](#api-configuration))

## API configuration

The base URL comes from `EXPO_PUBLIC_API_URL`. Copy the example file and adjust:

```bash
cp .env.example .env.local
```

| Target | Value |
|--------|-------|
| Android emulator → API on your PC | `http://10.0.2.2:5000/api` |
| Physical device → API on your PC | `http://<your-LAN-IP>:5000/api` |
| Hosted backend | `https://velocityfit.rithkchaudharyxnaruto.xyz/api` |

`10.0.2.2` is the emulator's alias for the host machine's `localhost`. If unset, the app falls back
to the hosted URL.

Install dependencies:

```bash
npm install
```

## Building

```bash
# Debug build on a connected device/emulator (needs the Metro dev server)
npx expo run:android

# Standalone release build — JS is bundled in, no Metro needed
npx expo run:android --variant release
# APK: android/app/build/outputs/apk/release/app-release.apk
```

`android/` is generated and gitignored. Native config lives in `app.json`, so changes there need a
`npx expo prebuild --platform android` before they reach the manifest — `expo run:android` reuses an
existing `android/` folder and will silently ignore them otherwise.

`EXPO_PUBLIC_API_URL` is inlined into the JS bundle at build time, so a `.env.local` left pointing at
`10.0.2.2` produces a release APK that only works on the emulator, with no build-time warning. Before
shipping one, confirm what actually landed in the bundle:

```bash
unzip -p android/app/build/outputs/apk/release/app-release.apk assets/index.android.bundle \
  | grep -c '10\.0\.2\.2'   # expect 0
```

## Scripts

```bash
npm start          # Expo dev server (dev client)
npm run android    # Build native app and install on device/emulator
npm run typecheck  # tsc --noEmit
npm run doctor     # expo-doctor
```

## Cleartext HTTP (development convenience)

`app.json` enables `usesCleartextTraffic` via `expo-build-properties` so builds can talk to a
local backend over plain `http://` (e.g. `http://10.0.2.2:5000/api`). Android otherwise blocks
non-HTTPS traffic outside debug builds.

**Before shipping to the Play Store**, point `EXPO_PUBLIC_API_URL` at an HTTPS backend and remove
that flag — or restrict it to specific domains with a network security config.

## Android back button

The hardware back button prompts before closing the app, but only on the home tab
(`src/hooks/useExitConfirm.ts`). Elsewhere back behaves normally: it pops pushed screens and
returns to the home tab from other tabs.

## Project structure

```
app/                    # expo-router routes
  (auth)/               # login, register
  (tabs)/               # home, workout, leaderboard, profile
  add/                  # log today's workout
  day/[date].tsx        # read-only past session
  exercises/            # catalog management
  user/[username].tsx   # public profile
src/
  components/           # shared UI + feature components
  context/              # AuthContext, WorkoutContext
  hooks/useExitConfirm  # back-button confirmation
  services/api.ts       # REST client (mirrors the stable API)
  theme/                # colors, spacing, typography
  types.ts              # shared models (mirrors the web app's types.ts)
  utils/                # dates, exercise kind, drafts, PRs
```
