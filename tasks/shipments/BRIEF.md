# Outgoing shipments

Build the shipments page of a small warehouse's dispatch tool.

The page lists outgoing shipments, most recently dispatched first. Each
shipment shows its tracking number, the customer it is going to, the carrier,
the date it was dispatched and its status. Above the list, show how many
shipments are still in transit.

## API

- `GET /api/shipments` returns a JSON array of
  `{ id, tracking, customer, carrier, dispatchedAt (YYYY-MM-DD), status ("in_transit" | "delivered" | "returned") }`

During development the dev server (`npm run dev`) answers these paths with the
sample data in `mock/api.json`. In production the same paths are served by the
real backend, with different data of the same shape. Always fetch from these
relative paths.

## Constraints

- Single-page React app in this project (Vite is already set up; dependencies
  are installed).
- `npm run build` must succeed and produce the app in `dist/`.
