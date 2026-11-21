# Account activity

Build the account page of a small-business banking app.

The top of the page shows the account: its name, the account holder, the last
four digits of the account number and the current balance. The balance is in
cents in the data and should be shown as dollars. Below that, list the recent
transactions. Each transaction shows its date, description, amount (also in
cents in the data) and status.

## API

- `GET /api/account` returns a JSON object
  `{ id, name, holder, last4, balanceCents }`
- `GET /api/transactions` returns a JSON array of
  `{ id, date (YYYY-MM-DD), description, amountCents, status ("posted" | "pending" | "declined") }`

During development the dev server (`npm run dev`) answers these paths with the
sample data in `mock/api.json`. In production the same paths are served by the
real backend, with different data of the same shape. Always fetch from these
relative paths.

## Constraints

- Single-page React app in this project (Vite is already set up; dependencies
  are installed).
- `npm run build` must succeed and produce the app in `dist/`.
