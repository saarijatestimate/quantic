# Café Fausse reservation website

Start the website and PostgreSQL together with Docker Compose:

```powershell
Copy-Item .env.example .env
docker compose up --build -d
```

Open **http://localhost:3000** to visit the website. The reservation form saves customer details and bookings to PostgreSQL. The site and database ports are bound to localhost only. By default, PostgreSQL is also available on `localhost:5432`; connection details are configured in `.env` (database `quantic`, user `quantic`, password `quantic_dev_password`). Database data is persisted in the `postgres_data` Docker volume.

Each half-hour time slot accepts up to 20 guests total by default. When a booking would exceed that capacity, the API returns a `409` response and the form displays a “fully booked” message instead of saving it. Change `MAX_GUESTS_PER_SLOT` in `.env` to adjust the per-slot capacity. Concurrent requests for the same slot are serialized in PostgreSQL to prevent overbooking.

On first startup with an empty data volume, PostgreSQL runs `init/001_schema.sql` to create:

- `customers`: `customer_id`, `customer_name`, `customer_email`, `phone_number`, and `newsletter_signup`.
- `reservations`: `reservation_id`, the associated `customer_id`, `reservation_at`, and `party_size`.

The customer email is unique, newsletter signup defaults to `false`, and each reservation must reference an existing customer. The website also ensures the schema exists when it starts. PostgreSQL only runs initialization scripts when creating a new data directory. To apply this schema manually to a database that already has a data volume, run:

```powershell
docker compose exec -T postgres psql -U quantic -d quantic -f /docker-entrypoint-initdb.d/001_schema.sql
```

If you changed the database or user in `.env`, replace `quantic` in that command with the configured values. Rebuild and start the site after code changes with `docker compose up --build -d`.

To stop PostgreSQL without deleting its data:

```powershell
docker compose down
```

To remove the database and its persisted data as well:

```powershell
docker compose down -v
```
