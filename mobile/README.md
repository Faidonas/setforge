# Spotter mobile and web client

## Brand assets

The approved single-lifter and barbell logo is used through `src/components/spotter-logo.tsx`.
Use `appearance="dark"` on dark surfaces (cyan symbol and white wordmark),
or `appearance="light"` for the monochrome dark artwork. Use `markOnly` for compact placements.

Production PNGs are in `assets/images/spotter/`; `app.json` uses these for iOS, Android
adaptive and themed icons, the web favicon, and the native splash screen. The approved
source board and generation prompt are preserved in `assets/brand/`.
Run `npm run brand:assets` to regenerate the complete asset set without redrawing the logo.
Native launcher and splash changes require a new app build; Expo Go does not show the
application's final launcher icon or native splash configuration.

## Authentication setup

Copy `.env.example` to `.env.local` and set the API URL plus the Supabase project URL and
publishable key. In Supabase, disable open sign-ups for the invite-only phase and enable Google
under Authentication providers. Add the deployed web origin and local Expo web origin to the
allowed redirect URLs.
For native builds, also allow `spotter://**` as a redirect URL. The planned production web origin is
`https://spotterapp.gr`.

After login, completed trainer and administrator accounts open the coach dashboard when the
browser viewport is at least 900 pixels wide. On smaller screens they open the training app.
This only selects the initial workspace: privileged accounts can always switch using **My
training** in the coach navigation or **Open coach dashboard** from the training profile.

The backend also needs `SUPABASE_ISSUER_URI` and `SUPABASE_JWK_SET_URI`. To let an
administrator create confirmed coach logins, set `SUPABASE_URL` and the project's
server-only `SUPABASE_SERVICE_ROLE_KEY`. `SUPABASE_SECRET_KEY` is also supported, but some
Supabase Auth deployments currently reject the new key format on user-creation requests.
Never place that key in an `EXPO_PUBLIC_*` variable or commit it to the repository.
Run
`docs/database/migrations/2026-10-06-add-supabase-auth.sql` once against an existing database
before starting the updated backend.

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
