# Event attendees

Build the event page of a conference organiser's tool.

The top of the page shows the event: its name, venue, date and capacity. Below
that is the attendee list. Each attendee shows their name, organisation, ticket
type and whether they have checked in. Show how many attendees have checked in
out of the total.

## API

- `GET /api/event` returns a JSON object
  `{ id, name, venue, date (YYYY-MM-DD), capacity }`
- `GET /api/attendees` returns a JSON array of
  `{ id, name, organisation, ticket ("standard" | "vip" | "speaker"), checkedIn (boolean) }`

During development the dev server (`npm run dev`) answers these paths with the
sample data in `mock/api.json`. In production the same paths are served by the
real backend, with different data of the same shape. Always fetch from these
relative paths.

## Constraints

- Single-page React app in this project (Vite is already set up; dependencies
  are installed).
- `npm run build` must succeed and produce the app in `dist/`.
