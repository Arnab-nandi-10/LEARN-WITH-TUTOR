# Tutor Client

This folder contains the Next.js frontend for Tutor LMS.

For full project setup, backend setup, and the complete repo structure, see the root [README](../README.md).

## Folder Overview

```text
client/
├── app/              # App Router pages
├── components/       # Shared and feature components
├── lib/              # API helpers, hooks, stores, types, utils
├── .env.example
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Environment

Create `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

For local development, the frontend can also fall back to `localhost:5001` if
you intentionally move the backend off `5000`.

## Install

```bash
cd client
npm install
```

## Run

```bash
cd client
npm run dev
```

The frontend runs on `http://localhost:3001`.

## Build

```bash
cd client
npm run build
npm start
```

## Scripts

```bash
npm run dev
npm run build
npm start
npm run lint
```
