# Customer lookup

Build a customer lookup page for a support tool.

At the top is a search box labelled "Search customers". Before the user types
anything, the page shows the most recently added customers. As the user types,
the list updates to show the matching customers; they should not need to press
Enter. Each customer shows their name, company, plan and email address.

Searching must go through the API: there are far too many customers to load at
once.

## API

- `GET /api/customers` returns the 5 most recently added customers.
- `GET /api/customers?q=<text>` returns up to 20 customers whose name or
  company contains the text (case-insensitive).

Both return a JSON array of `{ id, name, company, plan, email }`.

During development the dev server (`npm run dev`) answers these paths with the
sample data in `mock/api.json`. In production the same paths are served by the
real backend, with different data of the same shape. Always use these relative
paths.

## Constraints

- Single-page React app in this project (Vite is already set up; dependencies
  are installed).
- `npm run build` must succeed and produce the app in `dist/`.
