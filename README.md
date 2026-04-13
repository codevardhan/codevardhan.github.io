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
