# Deploying Kuziva to GitHub Pages

This project supports static export for GitHub Pages deployment.

## Setup Instructions

### 1. Build the Static Export

Run the export script to generate static HTML files:

```bash
npm run export
```

This will create an `out/` directory containing all static files configured for the `/Kuziva` base path.

### 2. GitHub Pages Configuration

1. Go to your repository settings on GitHub: `https://github.com/Manuhwa/Kuziva/settings/pages`

2. Under "Build and deployment":
   - **Source**: Select "GitHub Actions"

3. Create `.github/workflows/deploy.yml` with the following content:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build with Next.js
        run: npm run export
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./out

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 3. Deploy

Push your changes to the `main` branch:

```bash
git add .
git commit -m "Add GitHub Pages static export support"
git push origin main
```

GitHub Actions will automatically build and deploy your site.

### 4. Access Your Site

Once deployed, your site will be available at:
```
https://manuhwa.github.io/Kuziva/
```

## How It Works

### Route Changes

The following dynamic routes have been converted to query parameter style to support static export:

- `/examiner/mark/[id]` → `/examiner/mark?id=...`
- `/examiner/results/[id]` → `/examiner/results?id=...`
- `/result/[id]` → `/result?id=...`

All navigation within the app uses the query parameter format, so the user experience remains the same.

### Configuration

When `EXPORT=1` is set, `next.config.ts` automatically configures:

- `output: 'export'` - Enables static HTML export
- `basePath: '/Kuziva'` - Sets the base path for GitHub Pages
- `assetPrefix: '/Kuziva'` - Ensures assets load correctly
- `images.unoptimized: true` - Disables Next.js Image Optimization API

### Development vs Production

- **Development**: Run `npm run dev` for normal development with no base path
- **Production Build** (server): Run `npm run build` for a standard Next.js build
- **Static Export** (GitHub Pages): Run `npm run export` to generate static files with base path

## Troubleshooting

### Links Not Working

If internal links don't work after deployment, ensure you're using Next.js `<Link>` components. The `basePath` is automatically handled by Next.js Link components.

### Assets Not Loading

If images or other assets fail to load, verify they're in the `public/` directory and referenced correctly. The asset prefix is automatically applied.

### localStorage Data

Note that Kuziva stores all data in browser localStorage. This means:
- Data is local to each browser/device
- No data is persisted on the server
- Clearing browser data will reset the app

## Local Testing

To test the static export locally:

```bash
npm run export
npx serve out
```

Then visit `http://localhost:3000/Kuziva/` (note the base path).
