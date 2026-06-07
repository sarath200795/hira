# HIRA — Hazard Identification & Risk Assessment

A web app for building and managing workplace risk assessments: define activities,
identify hazards (GEMS taxonomy), score risk on a 5×5 matrix, apply the hierarchy of
controls with ALARP handling, and track everything through a dashboard, a filterable
repository, and CSV bulk import.

Built with React + Vite + Tailwind (claymorphism design system) and Firebase
(Auth + Firestore). The look & feel mirrors the companion **Fire Marshal** app.

## Quick start

```bash
npm install
cp .env.example .env   # then fill in your Firebase keys
npm run dev
```

## Create a Firebase project

1. Go to <https://console.firebase.google.com> → **Add project**.
2. **Build → Authentication → Get started →** enable **Email/Password**.
3. **Build → Firestore Database → Create database** (start in production mode).
4. **Project settings → General → Your apps → Web app (`</>`)** — register an app and
   copy the `firebaseConfig` values into `.env`:

   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

5. Restart `npm run dev`.

### Firestore security rules (starter)

Paste the contents of [`firestore.rules`](firestore.rules) into **Firestore → Rules → Publish**.
Signed-in users read the public org index and user profiles; assessments are scoped to the
caller's org.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() { return request.auth != null; }
    function isUser(uid) { return signedIn() && request.auth.uid == uid; }
    function myOrgId() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.orgId;
    }

    match /orgIndex/{slug} {
      allow read: if true;
      allow write: if signedIn();
    }

    match /users/{uid} {
      allow read: if signedIn();
      allow create, update: if isUser(uid);
    }

    match /organizations/{orgId} {
      allow create: if signedIn();
      allow read, update, delete: if signedIn();

      match /assessments/{docId} {
        allow read, write: if signedIn() && orgId == myOrgId();
      }
      match /activity/{docId} {
        allow read, create: if signedIn() && orgId == myOrgId();
        allow update, delete: if false;
      }
    }
  }
}
```

## Deploy (Firebase)

First time only — sign in to the Firebase CLI:

```bash
npm run firebase:login
```

Then:

```bash
npm run deploy:rules      # push firestore.rules only
npm run deploy:hosting    # build + deploy the web app to Firebase Hosting
npm run deploy            # build + deploy everything (rules + hosting)
```

The default project (`hira-3c898`) is set in `.firebaserc`. Hosting serves the Vite `dist/`
output with an SPA rewrite (all routes → `index.html`) so React Router deep links work.

## Deploy (Vercel)

Live: **https://hira-ruddy.vercel.app** · Repo: **https://github.com/sarath200795/hira**

The `VITE_FIREBASE_*` variables are set in the Vercel project (Production), and `vercel.json`
adds the SPA rewrite. Manual deploy:

```bash
vercel build --prod --yes
vercel deploy --prebuilt --prod --yes
```

**Auto-deploy on push** — `.github/workflows/deploy.yml` deploys to Vercel on every push to
`main`. It needs one secret:

```bash
# create a token at https://vercel.com/account/tokens, then:
gh secret set VERCEL_TOKEN
```

(Use the GitHub Action **or** Vercel's dashboard Git integration — not both, to avoid double deploys.)

> ⚠️ **Authorize the deploy domain in Firebase** or sign-in fails with `auth/unauthorized-domain`:
> Firebase Console → **Authentication → Settings → Authorized domains → Add domain** →
> `hira-ruddy.vercel.app` (and your Firebase Hosting domain if you use it).

## Guide character (3D, rigged-model ready)

The on-screen guide ("Sam") is a **3D character** (`three.js` / `@react-three/fiber`)
that walks, thinks, writes on the Create page, scratches its head, waves, and sleeps
when idle. It loads lazily, so it never weighs down the initial page.

It renders with a robust **3-tier fallback**:

1. **Realistic rigged `.glb`** — drop a licensed model (e.g. a free Mixamo human) +
   a `manifest.json` into [`public/character/`](public/character/README.txt) and the
   photoreal character loads automatically, switching skeletal animation clips per
   state. No code changes needed.
2. **Built-in procedural 3D figure** — used when no `.glb` is present (the default).
3. **2D SVG Sam** — used for `prefers-reduced-motion` users or if WebGL is unavailable.

No 3D assets are bundled (licensing). See
[`public/character/README.txt`](public/character/README.txt) for the exact Mixamo
download + manifest steps.

### Guide Q&A (hybrid: offline rules + optional AI)

Ask Sam questions in the chat panel. It answers in two tiers:

1. **Offline rules** (always on, free) — instant answers to known questions about
   your live data: counts, overdue/open actions, critical/high risks, ALARP,
   acceptable vs non-acceptable, busiest site, recent activity, per-site and
   per-assessment lookups.
2. **AI fallback** (optional) — for free-form questions the rules don't cover, the
   chat calls the [`api/assistant.js`](api/assistant.js) serverless function, which
   asks an LLM (Google Gemini by default) using a compact, data-only snapshot of
   your org's figures.

To enable the AI fallback, set a **server-side** `GEMINI_API_KEY` (free key at
<https://aistudio.google.com/app/apikey>) in **Vercel → Project → Settings →
Environment Variables** (Production). Do **not** prefix it with `VITE_` — that would
expose it in the browser. Locally, run `vercel dev` to exercise the `api/` route;
plain `npm run dev` skips it and the guide uses rules only.

> **Privacy:** when the AI fallback is enabled, the user's question plus an
> aggregate snapshot (the same figures shown in-app — totals, risk counts, site/
> activity breakdowns, recent activity, assessment names) is sent to the LLM
> provider. No raw control text or member contact details are sent. Leave
> `GEMINI_API_KEY` unset to keep everything fully offline.

## Features

- **Login / Sign up / Register organization** — email-password auth, org-scoped data.
- **Dashboard** — KPIs and charts by risk level, by activity, hazards per risk band,
  count under permissible risk, ALARP count, and control-measure status.
- **Create Risk Assessment** — 3 sections: details · members (internal/external) ·
  activities → hazards (Group → Category → Type cascade) → 5×5 risk matrix → hierarchy
  of controls + ALARP + projected residual risk.
- **Repository** — filter by site, name, and location; open the full read-only view.
- **Bulk Import** — CSV (one row per hazard/control), with a downloadable template.

The hazard taxonomy and risk matrix are sourced from the GEMS operations risk
assessment workbook.
