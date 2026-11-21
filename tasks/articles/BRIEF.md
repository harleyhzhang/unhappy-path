# Help centre search

Build the search page of a product help centre.

At the top is a search box labelled "Search help articles". Before the user
types anything, the page shows the most popular articles. As the user types,
the list updates to show the matching articles; they should not need to press
Enter. Each article shows its title, category, a one-line summary and when it
was last updated.

Searching must go through the API: the help centre has thousands of articles.

## API

- `GET /api/articles` returns the 5 most popular articles.
- `GET /api/articles?q=<text>` returns up to 20 articles whose title contains
  the text (case-insensitive).

Both return a JSON array of
`{ id, title, category, summary, updatedAt (YYYY-MM-DD) }`.

During development the dev server (`npm run dev`) answers these paths with the
sample data in `mock/api.json`. In production the same paths are served by the
real backend, with different data of the same shape. Always use these relative
paths.

## Constraints

- Single-page React app in this project (Vite is already set up; dependencies
  are installed).
- `npm run build` must succeed and produce the app in `dist/`.
