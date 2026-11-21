# Notifications inbox

Build a notifications inbox for a project-management tool.

The page shows the signed-in user's notifications, newest first. Each
notification shows who triggered it, what happened, which project it belongs
to, and when. Unread notifications should look different from read ones. Above
the list, show how many are unread.

## API

- `GET /api/notifications` returns a JSON array of
  `{ id, actor, action, project, createdAt (ISO 8601), read (boolean) }`

During development the dev server (`npm run dev`) answers these paths with the
sample data in `mock/api.json`. In production the same paths are served by the
real backend, with different data of the same shape. Always fetch from these
relative paths.

## Constraints

- Single-page React app in this project (Vite is already set up; dependencies
  are installed).
- `npm run build` must succeed and produce the app in `dist/`.
