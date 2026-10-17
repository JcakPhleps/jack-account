# Jack Account

One account across everything Jack builds — like a Google account. A single
central Firebase project provides **Auth** (username/password, email/password,
Google) and a shared **Firestore**. Any app imports `js/jackaccount.js` and
gets sign-in + a Firestore handle, no per-app user system needed.

```
import { JackAccount, fs } from "/jack-account/js/jackaccount.js";
JackAccount.onAuthState(u => ...);
await JackAccount.signIn("jack", "pw");   // username OR email
JackAccount.uid();                        // the one id that ties apps together
```

## First-time Firebase setup (do this once)

1. **Create the project.** [console.firebase.google.com](https://console.firebase.google.com)
   → *Add project* → name it **jack-account** (the Project ID should come out
   `jack-account`; if taken, use what it gives you and update `projectId` in
   `js/config.js`). Skip Analytics.
2. **Register a web app.** Project Overview → the `</>` (Web) icon → nickname
   "jack-account" → *Register*. Copy the `firebaseConfig` values into
   `js/config.js` (replace every `PASTE_ME_*`).
3. **Enable sign-in methods.** Build → Authentication → *Get started* →
   Sign-in method tab → enable **Email/Password** and **Google**.
   (Usernames ride on Email/Password via an internal `@jack.id` email.)
4. **Create Firestore.** Build → Firestore Database → *Create database* →
   Production mode → pick a region → then Rules tab → paste `firestore.rules`
   → *Publish*.
5. **Authorize your domains.** Authentication → Settings → Authorized domains →
   add `jcakphleps.github.io` (and `localhost` for testing).

That's it — the account now works everywhere it's imported.

## Hosting

Publish this repo to GitHub Pages so it serves at
`https://jcakphleps.github.io/jack-account/`. Apps hosted under the **same
origin** (e.g. `jcakphleps.github.io/dude-mobile/`) can import the SDK with the
absolute path `"/jack-account/js/jackaccount.js"`. Apps on a different origin
should vendor a copy of `js/jackaccount.js` + `js/config.js`.

## Data contract (Firestore)

Everything an app stores lives under `/<app>/{uid}/...`, private to that account.
Dude uses the `dudes` tree:

```
/users/{uid}                         profile: username, displayName, email, provider
/dudes/{uid}/pairing/current         { code, deviceId, deviceName, expiresAt, claimed, claimedBy }
/dudes/{uid}/devices/{deviceId}      { name, platform, pairedAt, lastSeen }
/dudes/{uid}/commands/{cmdId}        { text, kind:"command"|"spawn", color?, deviceId,
                                       status:"pending"|"running"|"done"|"error",
                                       result?, createdAt, updatedAt, source:"mobile" }
/dudes/{uid}/meeseeks/{taskId}       { label, color, status, createdAt }  (desktop-published, live state)
```

- **Pairing:** desktop publishes `pairing/current` with a 6-digit `code` that
  regenerates every 60s. Phone (same account) types the code → sets
  `claimed:true` + registers under `devices/`. Desktop sees it → linked.
- **Commands:** phone writes a `pending` command; desktop polls, runs it through
  Dude's agent loop, writes back `status` + `result`. Phone watches live.
- **Spawn / meeseeks:** `kind:"spawn"` makes the desktop spawn a colored one-off
  Dude that disappears when the task is done.

## Adopting Jack Account in another app

1. Import the SDK (same-origin path, or vendor a copy).
2. Replace the app's own `signIn/signUp` with `JackAccount.*`.
3. Add an `/<app>/{uid}/{document=**}` block to `firestore.rules`.
4. Add `jcakphleps.github.io` to Authorized domains (already done above).

Existing per-app Firebase projects (Ping, Cribs, Aero) can keep their own data
and just add a "Sign in with Jack Account" button — no migration required.
