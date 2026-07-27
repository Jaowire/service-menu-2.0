# Taverna INFINITI Service Menu

This folder is the Render-ready version of the service consultation app. It uses
standard Next.js on Node.js and includes a Render Blueprint in `render.yaml`.

## Replace the files in your existing GitHub repository

1. Download and unzip the Render-ready package.
2. Open your existing GitHub repository.
3. Choose **Add file**, then **Upload files**.
4. Upload the contents of the unzipped folder into the repository root. The
   repository root should show `app`, `public`, `scripts`, `package.json`,
   `pnpm-lock.yaml`, `pnpm-workspace.yaml`, and `render.yaml`.
5. Select **Commit directly to the main branch**, then commit the changes.

Do not upload the outer folder as a single nested folder. `package.json` and
`render.yaml` must be visible at the top level of the GitHub repository.
The included TypeScript settings isolate this app from older Cloudflare or
Vinext files that might still exist in the repository.

## Render settings

If the Render service is already connected to this repository and automatic
deploys are enabled, committing to `main` starts the deployment.

For a new Render service, use **New > Blueprint** and choose the GitHub
repository. Render reads these settings from `render.yaml`:

- Runtime: Node
- Build command:
  `corepack enable && pnpm install --frozen-lockfile && pnpm build`
- Start command: `pnpm start`
- Health check: `/`
- Automatic deploys: every commit

The server listens on Render's assigned `PORT` and binds to `0.0.0.0`.

## Local development

```bash
corepack enable
pnpm install
pnpm dev
```
