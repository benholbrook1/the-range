# the-range

The Range is a golf training app for tracking progress on practice drills.

## Docs

| Doc | Purpose |
| --- | --- |
| [implementation.md](implementation.md) | Product principles and screens |
| [architecture.md](architecture.md) | Technical structure, offline model, testing |
| [design.md](design.md) | Visual system |
| [mvp-build.md](mvp-build.md) | Step-by-step MVP build guide |

Follow [mvp-build.md](mvp-build.md) to implement the MVP.

## Run the app

```bash
npm install
npm start
```

Then open in Expo Go (iOS/Android) or press `w` for web.

```bash
npm run ios
npm run android
npm run web
```

## Tests

```bash
npm test
```

Unit tests cover domain scoring, pack validation, and session/drill services (in-memory store).
