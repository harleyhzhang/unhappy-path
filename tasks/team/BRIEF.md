# Team directory

Build a team directory for a company intranet.

The page shows every team member as a card with their name, role, department,
location and email address. Group or label people by department so it is easy
to scan. Show the total number of people.

## API

- `GET /api/members` returns a JSON array of
  `{ id, name, role, department, location, email }`

During development the dev server (`npm run dev`) answers these paths with the
sample data in `mock/api.json`. In production the same paths are served by the
real backend, with different data of the same shape. Always fetch from these
relative paths.

## Constraints

- Single-page React app in this project (Vite is already set up; dependencies
  are installed).
- `npm run build` must succeed and produce the app in `dist/`.
