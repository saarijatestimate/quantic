# Cafe Fausse

This project is currently using a simple static-site setup for the restaurant pages, and it also includes a small Express API for reservations.

## React note
The site is not yet running as a full React app, but React can be added if you want a component-based frontend.

## How to install React
If you want to start using React in this project, install it with Vite:

```bash
npm create vite@latest . --template react
npm install
```

This will add:
- React
- ReactDOM
- Vite
- The basic app structure for a modern frontend

## Start the app
After installation:

```bash
npm run dev
```

Then open the local URL shown in the terminal.

## db 
-	Actions performed: installed PostgreSQL in Ubuntu-24.04, created database cafe_db, applied schema.sql.
- How to connect (interactive WSL session):
o	Open WSL: wsl -d Ubuntu-24.04 -- bash
o	Connect as postgres: sudo -u postgres psql -d cafe_db



## Current project structure
- Static HTML pages in the workspace root
- Shared styles in `styles.css`
- Reservation API in `server/index.js`
- Database connection in `server/db.js`

