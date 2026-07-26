# AI Tooling

This workspace includes a simple static site.

## Current setup
- Static pages: HTML files in the workspace root
- Shared styles: `styles.css`
- API server: `server/index.js`
- Database connection: `server/db.js`

## Useful commands

Start the API:
```bash
npm run start:api
```

Open the site locally via a simple static server:
```bash
python -m http.server 3000
```

Then visit:
- http://localhost:3000/index.html
- http://localhost:4000/health

## Notes
- The reservation form posts to the API at `http://localhost:4000/reservations`.
- PostgreSQL is configured locally for development use.

## Copilot and Claude story
GitHub Copilot helps speed up coding tasks by suggesting code, tests, and small refactors while you work in the editor. Claude can be used for broader reasoning, writing documentation, and helping explain architecture or implementation choices. Together, they are useful for building features quickly while keeping the project organized.


