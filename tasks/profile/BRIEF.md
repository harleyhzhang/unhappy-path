# Profile settings

Build the "Profile" settings page of a web app.

The page loads the signed-in user's profile and shows it in a form the user
can edit:

- "Full name" (required)
- "Email" (required)
- "Bio" (multi-line, optional)

and a "Save changes" button. When the changes are saved, tell the user.

## API

- `GET /api/profile` returns `{ name, email, bio }`.
- `PUT /api/profile` with a JSON body `{ name, email, bio }` saves the profile
  and returns the saved profile.

During development the dev server (`npm run dev`) answers these paths with the
sample data in `mock/api.json`. In production the same paths are served by the
real backend, with different data of the same shape. Always use these relative
paths.

## Constraints

- Single-page React app in this project (Vite is already set up; dependencies
  are installed).
- `npm run build` must succeed and produce the app in `dist/`.
