# Invoices table

Build an invoices page for a small-business accounting tool.

The page lists the company's invoices in a table: invoice number, customer,
issue date, amount and status (paid, due or overdue). Amounts are in cents in
the data and should be shown as dollars. Show the total outstanding amount
(everything not paid) above the table.

## API

- `GET /api/invoices` returns a JSON array of
  `{ id, number, customer, issuedAt (YYYY-MM-DD), amountCents, status ("paid" | "due" | "overdue") }`

During development the dev server (`npm run dev`) answers these paths with the
sample data in `mock/api.json`. In production the same paths are served by the
real backend, with different data of the same shape. Always fetch from these
relative paths.

## Constraints

- Single-page React app in this project (Vite is already set up; dependencies
  are installed).
- `npm run build` must succeed and produce the app in `dist/`.
