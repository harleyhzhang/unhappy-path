# Workspace settings

Build the "Workspace" settings page of a web app.

The page loads the workspace's current settings and shows them in a form the
user can edit:

- "Workspace name" (required)
- "Support email" (required)
- "Description" (multi-line, optional)

and a "Save settings" button. When the settings are saved, tell the user.

## API

- `GET /api/workspace` returns `{ name, supportEmail, description }`.
- `PUT /api/workspace` with a JSON body `{ name, supportEmail, description }`
  saves the settings and returns the saved settings.

During development the dev server (`npm run dev`) answers these paths with the
sample data in `mock/api.json`. In production the same paths are served by the
real backend, with different data of the same shape. Always use these
relative paths.

## Constraints

- Single-page React app in this project (Vite is already set up; dependencies
  are installed).
- `npm run build` must succeed and produce the app in `dist/`.
