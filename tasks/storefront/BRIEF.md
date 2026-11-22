# Store settings

Build the "Store" settings page of an online shop's admin.

The page loads the store's current settings and shows them in a form the user
can edit:

- "Store name" (required)
- "Contact phone" (required)
- "Tagline" (multi-line, optional)

and a "Save store" button. When the settings are saved, tell the user.

## API

- `GET /api/store` returns `{ name, phone, tagline }`.
- `PUT /api/store` with a JSON body `{ name, phone, tagline }` saves the
  settings and returns the saved settings.

During development the dev server (`npm run dev`) answers these paths with the
sample data in `mock/api.json`. In production the same paths are served by the
real backend, with different data of the same shape. Always use these
relative paths.

## Constraints

- Single-page React app in this project (Vite is already set up; dependencies
  are installed).
- `npm run build` must succeed and produce the app in `dist/`.
