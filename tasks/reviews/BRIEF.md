# Product reviews

Build the reviews section of a product page for an online shop.

Show the product's name, its average rating and how many reviews it has.
Below that, list the customer reviews: reviewer name, star rating out of 5,
review title, review text and date.

## API

- `GET /api/product` returns a JSON object
  `{ id, name, averageRating (0 to 5), reviewCount }`
- `GET /api/reviews` returns a JSON array of
  `{ id, reviewer, rating (1 to 5), title, body, createdAt (YYYY-MM-DD) }`

During development the dev server (`npm run dev`) answers these paths with the
sample data in `mock/api.json`. In production the same paths are served by the
real backend, with different data of the same shape. Always fetch from these
relative paths.

## Constraints

- Single-page React app in this project (Vite is already set up; dependencies
  are installed).
- `npm run build` must succeed and produce the app in `dist/`.
