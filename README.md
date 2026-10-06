# EasySB Docs

Documentation site for [EasySB](https://github.com/EasySBTeam/EasySB), built with
VitePress and the [Teek](https://github.com/Kele-Bingtang/vitepress-theme-teek) theme,
published at <https://docs.kejizero.xyz>.

## Source layout

```
docs/                 Simplified Chinese (default locale)
docs/en/              English
docs/.vitepress/      VitePress config, Teek theme and styles
docs/public/          Static assets served from the site root (including CNAME)
.github/workflows/    GitHub Actions build and Pages deployment
```

The Chinese pages live at the site root (`/guide/...`); the English pages live under
`/en/`. Every page exists in both locales, and each locale declares its own sidebar in
`docs/.vitepress/config.mts`. Internal links in English pages point at `/en/...`.

## Prerequisites

- Node.js 22 or newer and npm (the versions the CI workflow pins).

## Build and preview

```bash
# Install dependencies from the lockfile
npm ci

# Start the dev server with hot reload
npm run docs:dev

# Build the static site into docs/.vitepress/dist
npm run docs:build

# Preview the built site locally
npm run docs:preview
```

`npm ci` installs exactly the versions recorded in `package-lock.json`. When the
dependency set changes intentionally, refresh the lockfile with
`npm install --package-lock-only` and commit the result.

## Deployment

`.github/workflows/deploy-docs.yml` builds the site and deploys it to GitHub Pages. It
runs on every push to `main`, and can be triggered by hand with **Run workflow**
(`workflow_dispatch`).

The workflow uses:

- `actions/configure-pages`, `actions/upload-pages-artifact` and `actions/deploy-pages`;
- the `pages: write` and `id-token: write` permissions, plus `contents: read`;
- a `pages` concurrency group with `cancel-in-progress: false`, so a running deployment
  finishes before another starts.

The custom domain is pinned by `docs/public/CNAME`, which VitePress copies to the site
root as `CNAME` containing `docs.kejizero.xyz`.

### One-time Pages and DNS prerequisites

These are set once, outside the repository:

1. In the repository's **Settings → Pages**, set **Build and deployment → Source** to
   **GitHub Actions**, and enter `docs.kejizero.xyz` as the custom domain.
2. At the DNS provider, point the subdomain at GitHub Pages. For the apex-adjacent
   `docs` host, add a `CNAME` record: `docs` → `minimaxflora.github.io`.
3. Wait for GitHub to verify the domain and issue the HTTPS certificate (this can take
   a few minutes after the first successful deploy).

Without step 1 the site stays on `github.io`, and without step 2 the custom domain
does not resolve, even though the build and upload succeed.

## License

Released under GPL-3.0, matching the EasySB project.
