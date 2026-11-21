# Store dashboard

Build the home dashboard for an online store's admin panel.

The top of the page shows four headline numbers for today: revenue, orders,
new customers and refund rate. Revenue is in cents in the data and should be
shown as dollars; refund rate is a fraction and should be shown as a
percentage. Below that, show a "Recent orders" list with the order number,
customer, item count and total for each order.

## API

- `GET /api/stats` returns a JSON object
  `{ revenueCents, orders, newCustomers, refundRate (0 to 1) }`
- `GET /api/orders` returns a JSON array of
  `{ id, number, customer, items, totalCents }`

During development the dev server (`npm run dev`) answers these paths with the
sample data in `mock/api.json`. In production the same paths are served by the
real backend, with different data of the same shape. Always fetch from these
relative paths.

## Constraints

- Single-page React app in this project (Vite is already set up; dependencies
  are installed).
- `npm run build` must succeed and produce the app in `dist/`.
