# Order detail

Build the order detail page of an online store's admin panel.

The top of the page shows the order: its number, the customer, when it was
placed, its status and its total. The total is in cents in the data and should
be shown as dollars. Below that, list the order's shipments. Each shipment
shows the carrier, tracking number, status and estimated arrival date.

## API

- `GET /api/order` returns a JSON object
  `{ id, number, customer, placedAt (YYYY-MM-DD), status, totalCents }`
- `GET /api/shipments` returns a JSON array of
  `{ id, carrier, trackingNumber, status, eta (YYYY-MM-DD) }`

During development the dev server (`npm run dev`) answers these paths with the
sample data in `mock/api.json`. In production the same paths are served by the
real backend, with different data of the same shape. Always fetch from these
relative paths.

## Constraints

- Single-page React app in this project (Vite is already set up; dependencies
  are installed).
- `npm run build` must succeed and produce the app in `dist/`.
