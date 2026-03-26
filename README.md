# AI Clinical Copilot MVP

A lightweight Next.js prototype for therapist-facing documentation drafting, reflection, and supervision prep.

This app:
- collects de-identified case context in the browser
- sends requests to a server-side Next.js API route
- calls the OpenAI Responses API from the server
- renders structured output for draft or editing workflows

## Deployment Readiness Notes

This project is ready for Vercel with a small server-side environment setup.

Audit summary:
- The OpenAI API key is used only on the server in [`app/api/generate/route.ts`](/C:/Users/valdr/Documents/MFTBRAIN/app/api/generate/route.ts).
- The API route is explicitly set to the Node.js runtime, which is appropriate for the OpenAI SDK.
- No filesystem, local path, or localhost-only runtime assumptions are used by the app.
- Browser-only features such as `localStorage` and `window` are used only inside the client component [`app/page.tsx`](/C:/Users/valdr/Documents/MFTBRAIN/app/page.tsx).
- Feedback persistence is intentionally browser-local only for prototype testing.

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create local environment file

Copy [`.env.local.example`](/C:/Users/valdr/Documents/MFTBRAIN/.env.local.example) to `.env.local` and fill in your values:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-5-mini
```

### 3. Run the app locally

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Required Environment Variables

### `OPENAI_API_KEY`

Required.

Used by the server-side API route to call OpenAI.

### `OPENAI_MODEL`

Optional.

If omitted, the app defaults to `gpt-5-mini`.

## Vercel Deployment

### 1. Push the project to GitHub

Commit your project and push it to a GitHub repository.

### 2. Import the project into Vercel

In Vercel:
1. Click `Add New Project`
2. Import the GitHub repository
3. Keep the framework preset as `Next.js`

### 3. Configure environment variables

In the Vercel project settings, add:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (optional)

Recommended:
- add `OPENAI_API_KEY` for Production, Preview, and Development environments as needed
- add `OPENAI_MODEL` only if you want to override the default

### 4. Deploy

Click `Deploy`.

Vercel will automatically:
- install dependencies
- build the Next.js app
- deploy the app and API route together

## Build Check

To verify production readiness locally:

```bash
npm run build
```

## Notes For Prototype Testing

- Do not enter PHI or real client-identifying information.
- Feedback entries are stored only in the current browser via `localStorage`.
- Generated content should always be reviewed by a clinician before use.
