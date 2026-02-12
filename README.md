# QOOA Frontend (Standalone)

This repository directory contains the standalone frontend for the QOOA Control Tower.

Contents
- static HTML files
- CSS and JS under `css/` and `js/`
- `serve-frontend.js` — simple local server used for development

Quick start
1. Install dependencies (if any):

```powershell
# optional: install dependencies if you add any
npm install
```

2. Run the local server:

```powershell
node serve-frontend.js
# then open http://localhost:3000 (or whatever the server prints)
```

Deploy
This folder is intended to be deployed as a static site (Netlify, Vercel, etc.). The main project includes a `netlify.toml` so you can use Netlify to publish this folder (see repository root).
