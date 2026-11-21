# New support ticket

Build the "New support ticket" page of a customer help desk.

The page is a form with these fields:

- "Subject" (single line, required)
- "Email" (the customer's email address, required)
- "Priority" (Low, Normal or High; Normal by default)
- "Description" (multi-line, required)

and a "Create ticket" button. When the ticket is created, show a confirmation
that includes the ticket reference returned by the API.

## API

- `POST /api/tickets` with a JSON body
  `{ subject, email, priority ("low" | "normal" | "high"), description }`
  creates the ticket and returns status 201 with `{ id, reference }`.

During development the dev server (`npm run dev`) answers these paths with the
sample data in `mock/api.json`. In production the same paths are served by the
real backend, with different data of the same shape. Always use these relative
paths.

## Constraints

- Single-page React app in this project (Vite is already set up; dependencies
  are installed).
- `npm run build` must succeed and produce the app in `dist/`.
