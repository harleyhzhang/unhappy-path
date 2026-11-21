# Product inventory search

Build the inventory search page of a shop's stock room tool.

At the top is a search box labelled "Search products". Before the user types
anything, the page shows the most recently restocked products. As the user
types, the list updates to show the matching products; they should not need to
press Enter. Each product shows its name, SKU, category and how many are in
stock.

Searching must go through the API: the catalogue is far too large to load at
once.

## API

- `GET /api/products` returns the 5 most recently restocked products.
- `GET /api/products?q=<text>` returns up to 20 products whose name or SKU
  contains the text (case-insensitive).

Both return a JSON array of `{ id, name, sku, category, stock }`.

During development the dev server (`npm run dev`) answers these paths with the
sample data in `mock/api.json`. In production the same paths are served by the
real backend, with different data of the same shape. Always use these
relative paths.

## Constraints

- Single-page React app in this project (Vite is already set up; dependencies
  are installed).
- `npm run build` must succeed and produce the app in `dist/`.
