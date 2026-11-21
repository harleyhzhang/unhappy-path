# Invite a teammate

Build the "Invite a teammate" page of a team workspace app.

The page is a form with these fields:

- "Full name" (single line, required)
- "Work email" (the teammate's email address, required)
- "Role" (Viewer, Editor or Admin; Editor by default)
- "Welcome note" (multi-line, required)

and a "Send invitation" button. When the invitation is sent, show a
confirmation that includes the invitation code returned by the API.

## API

- `POST /api/invitations` with a JSON body
  `{ name, email, role ("viewer" | "editor" | "admin"), note }`
  sends the invitation and returns status 201 with `{ id, code }`.

During development the dev server (`npm run dev`) answers these paths with the
sample data in `mock/api.json`. In production the same paths are served by the
real backend, with different data of the same shape. Always use these
relative paths.

## Constraints

- Single-page React app in this project (Vite is already set up; dependencies
  are installed).
- `npm run build` must succeed and produce the app in `dist/`.
