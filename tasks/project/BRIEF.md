# Project overview

Build the overview page for one project in a project-management tool.

The top of the page shows the project: its name, owner, status and due date.
Below that is the project's task list. Each task shows its title, who it is
assigned to and whether it is done. Show how many tasks are done out of the
total.

## API

- `GET /api/project` returns a JSON object
  `{ id, name, owner, status ("on track" | "at risk" | "blocked"), dueDate (YYYY-MM-DD) }`
- `GET /api/tasks` returns a JSON array of `{ id, title, assignee, done (boolean) }`

During development the dev server (`npm run dev`) answers these paths with the
sample data in `mock/api.json`. In production the same paths are served by the
real backend, with different data of the same shape. Always fetch from these
relative paths.

## Constraints

- Single-page React app in this project (Vite is already set up; dependencies
  are installed).
- `npm run build` must succeed and produce the app in `dist/`.
