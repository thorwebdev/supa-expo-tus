# Image Upload Example

### Setup

- Set up env vars `cp .env.local.example .env.local`
- In the Supabase dashboard, create a new bucket called `tus`
  - Create a new policy and allow `select`, `insert` and `update` operations for the public anon key.

### Running the app

- Run `yarn` or `npm install`
- Run `yarn start` or `npm run start` to try it out.
