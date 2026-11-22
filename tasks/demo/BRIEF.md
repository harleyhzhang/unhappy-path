# Book a demo

Build the "Book a demo" page of a software company's website.

The page is a form with these fields:

- "Your name" (single line, required)
- "Company" (single line, required)
- "Work email" (required)
- "Team size" (1 to 10, 11 to 50 or more than 50; 11 to 50 by default)
- "What would you like to see?" (multi-line, optional)

and a "Request demo" button. When the request is sent, show a confirmation
that includes the reference number returned by the API.

## API

- `POST /api/demo-requests` with a JSON body
  `{ name, company, email, teamSize ("1-10" | "11-50" | "50+"), message }`
  books the demo and returns status 201 with `{ id, reference }`.

During development the dev server (`npm run dev`) answers these paths with the
sample data in `mock/api.json`. In production the same paths are served by the
real backend, with different data of the same shape. Always use these
relative paths.

## Constraints

- Single-page React app in this project (Vite is already set up; dependencies
  are installed).
- `npm run build` must succeed and produce the app in `dist/`.
