# Billing settings

Build the billing page of a software product's account settings.

The top of the page shows the current subscription: the plan name, its price
per month, how many seats are in use out of the total, and the renewal date.
Prices are in cents in the data and should be shown as dollars. Below that is
the payment history: date, amount, payment method and status for each payment.

## API

- `GET /api/subscription` returns a JSON object
  `{ plan, priceCents, seatsUsed, seatsTotal, renewsAt (YYYY-MM-DD) }`
- `GET /api/payments` returns a JSON array of
  `{ id, date (YYYY-MM-DD), amountCents, method, status ("paid" | "refunded" | "failed") }`

During development the dev server (`npm run dev`) answers these paths with the
sample data in `mock/api.json`. In production the same paths are served by the
real backend, with different data of the same shape. Always fetch from these
relative paths.

## Constraints

- Single-page React app in this project (Vite is already set up; dependencies
  are installed).
- `npm run build` must succeed and produce the app in `dist/`.
