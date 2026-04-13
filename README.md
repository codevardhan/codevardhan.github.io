# Portfolio — Astro

Migrated from Hugo (hugo-profile theme) to [Astro](https://astro.build).

## Quick Start

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # outputs to dist/
npm run preview    # preview the build
```

## Structure

```
src/
├── content/
│   ├── posts/          # Blog posts (markdown)
│   └── projects/       # Project writeups (markdown)
├── layouts/
│   ├── BaseLayout.astro   # Nav, footer, mermaid/mathjax scripts
│   └── PostLayout.astro   # Article layout for posts & projects
├── pages/
│   ├── index.astro        # Homepage (hero, about, experience, projects, contact)
│   ├── resume.astro       # Resume page
│   ├── posts/index.astro  # Blog listing
│   ├── posts/[slug].astro # Individual post
│   └── projects/[slug].astro
└── styles/
    └── global.css         # Tailwind + prose styles
public/
├── images/          
└── videos/       
```
## Deploy to GitHub Pages

Add `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

Then in repo Settings → Pages, set source to "GitHub Actions".
