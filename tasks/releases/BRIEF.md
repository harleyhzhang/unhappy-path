# Release notes

Build the release notes page of a desktop app's website.

The page lists the app's releases, newest first. Each release shows its version
number, its title, the date it was released and a one-line summary. Above the
list, show how many releases there are.

## API

- `GET /api/releases` returns a JSON array of
  `{ id, version, title, releasedAt (YYYY-MM-DD), summary }`

During development the dev server (`npm run dev`) answers these paths with the
sample data in `mock/api.json`. In production the same paths are served by the
real backend, with different data of the same shape. Always fetch from these
relative paths.

## Constraints

- Single-page React app in this project (Vite is already set up; dependencies
  are installed).
- `npm run build` must succeed and produce the app in `dist/`.
