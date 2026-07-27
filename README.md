# Taverna INFINITI Service Menu — Render Static Site

This package preserves the current service-menu interface and exports it as
static HTML, CSS, and JavaScript. Render serves the generated `out` folder from
its CDN. No web server, health check, pnpm, or Corepack is required.

## Replace the GitHub repository files

1. Download and extract the ZIP package.
2. In the existing GitHub repository, remove the previously uploaded app files.
3. Upload the contents inside this folder into the repository root.
4. Confirm that `package.json`, `package-lock.json`, and `render.yaml` appear at
   the top level—not inside another folder.
5. Commit the changes directly to the `main` branch.

## One-time Render change

An existing Render Web Service cannot be converted into a Static Site. Delete
the failed Web Service in Render, without deleting the GitHub repository.

Then select **New > Blueprint**, connect the same GitHub repository, and deploy.
Render reads `render.yaml`, builds the site, and publishes the `out` directory.
Every later commit to `main` automatically deploys.
