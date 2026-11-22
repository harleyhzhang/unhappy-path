# Supplier orders

Build the supplier page of a furniture workshop's purchasing tool.

The top of the page shows the supplier: its name, the contact person, the city
and the open balance the workshop owes. The balance is in cents in the data and
should be shown as dollars. Below that, list the purchase orders placed with
this supplier. Each order shows its order number, the date it was placed, its
total (also in cents in the data) and its status.

## API

- `GET /api/supplier` returns a JSON object
  `{ id, name, contact, city, openBalanceCents }`
- `GET /api/orders` returns a JSON array of
  `{ id, number, placedAt (YYYY-MM-DD), totalCents, status ("draft" | "sent" | "received") }`

During development the dev server (`npm run dev`) answers these paths with the
sample data in `mock/api.json`. In production the same paths are served by the
real backend, with different data of the same shape. Always fetch from these
relative paths.

## Constraints

- Single-page React app in this project (Vite is already set up; dependencies
  are installed).
- `npm run build` must succeed and produce the app in `dist/`.
