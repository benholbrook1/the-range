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

## Install on your iPhone (free Apple ID, 7-day build)

This installs a real app via Xcode signing. Free Apple Developer profiles expire after **7 days** — rerun the device build to refresh.

1. On your Mac: install Xcode from the App Store, open it once, and accept the license.
2. **Xcode → Settings → Accounts** → add your Apple ID.
3. On the iPhone: enable **Developer Mode** (Settings → Privacy & Security) and connect with a cable. Trust the computer.
4. In the project, install a **Release** build (JS is embedded — no Metro required). This always regenerates the native `ios` project so icons stay current:

```bash
git checkout main
git pull origin main
npm install
npm run ios:device:release
```

5. When prompted, pick your iPhone. First run may open Xcode — select your **Personal Team** for signing if asked.
6. On the phone, if it won’t open: **Settings → General → VPN & Device Management** → trust your developer certificate.

Bundle ID: `com.therange.app` (change in `app.json` if that ID is already taken on your account).

### Icon still shows the old Expo logo

iOS caches icons, and a leftover local `ios/` folder can keep the old AppIcon. Do a full clean:

```bash
rm -rf ios
npm run ios:device:release
```

Then delete the app from the phone, **restart the iPhone**, and install again.

### “No script URL provided”

That means you installed a **Debug** build (`npm run ios:device`), which expects Metro on your Mac. Either:

- Use the Release command above (`ios:device:release`), or
- Keep Debug and run `npm start` on the Mac while the phone is on the **same Wi‑Fi**, then reopen the app.

**Faster alternative:** install **Expo Go** from the App Store, run `npm start`, and scan the QR code. No signing needed; good for quick checks.

## Tests

```bash
npm test
```

Unit tests cover domain scoring, pack validation, and session/drill services (in-memory store).
