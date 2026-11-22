# Spare parts search

Build the parts search page of a building maintenance team's stores tool.

At the top is a search box labelled "Search parts". Before the user types
anything, the page shows the most recently added parts. As the user types, the
list updates to show the matching parts; they should not need to press Enter.
Each part shows its name, part number, the storage bin it is kept in and how
many are on hand.

Searching must go through the API: the parts list is far too large to load at
once.

## API

- `GET /api/parts` returns the 5 most recently added parts.
- `GET /api/parts?q=<text>` returns up to 20 parts whose name or part number
  contains the text (case-insensitive).

Both return a JSON array of `{ id, name, partNumber, bin, quantity }`.

During development the dev server (`npm run dev`) answers these paths with the
sample data in `mock/api.json`. In production the same paths are served by the
real backend, with different data of the same shape. Always fetch from these
relative paths.

## Constraints

- Single-page React app in this project (Vite is already set up; dependencies
  are installed).
- `npm run build` must succeed and produce the app in `dist/`.
