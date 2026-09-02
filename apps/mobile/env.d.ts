/**
 * Environment type declarations for Expo public environment variables.
 *
 * Expo exposes variables prefixed with `EXPO_PUBLIC_` through `process.env`
 * at build time. The Expo tsconfig base does not include Node types by
 * default, so `process` is untyped in the mobile project. This file
 * declares the minimal `process.env` shape used by the app without pulling
 * in the full Node type surface (which would weaken strictness elsewhere).
 *
 * Add new `EXPO_PUBLIC_*` variables here as they are introduced.
 */

declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
    EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?: string;
    EXPO_PUBLIC_DEV_GUEST_ID?: string;
    EXPO_PUBLIC_ENABLE_DEV_LOGIN?: string;
  };
};
