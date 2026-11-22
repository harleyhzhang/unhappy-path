# Course roster

Build the course page of a training team's learning tool.

The top of the page shows the course: its title, the instructor, the date it
starts and how many seats it has. Below that is the roster. Each student shows
their name, email, how far through the course they are (a percentage) and
their status. Show how many students have completed the course.

## API

- `GET /api/course` returns a JSON object
  `{ id, title, instructor, startsOn (YYYY-MM-DD), seats }`
- `GET /api/students` returns a JSON array of
  `{ id, name, email, progress (0 to 100), status ("active" | "paused" | "completed") }`

During development the dev server (`npm run dev`) answers these paths with the
sample data in `mock/api.json`. In production the same paths are served by the
real backend, with different data of the same shape. Always fetch from these
relative paths.

## Constraints

- Single-page React app in this project (Vite is already set up; dependencies
  are installed).
- `npm run build` must succeed and produce the app in `dist/`.
