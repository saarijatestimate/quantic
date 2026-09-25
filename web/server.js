const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const helmet = require("helmet");
const { Pool } = require("pg");

const app = express();
const port = Number(process.env.PORT || 3000);
const maxGuestsPerSlot = Number(process.env.MAX_GUESTS_PER_SLOT || 20);
if (!Number.isSafeInteger(maxGuestsPerSlot) || maxGuestsPerSlot < 1) {
  throw new Error("MAX_GUESTS_PER_SLOT must be a positive integer.");
}
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.POSTGRES_DB || "quantic",
  user: process.env.POSTGRES_USER || "quantic",
  password: process.env.POSTGRES_PASSWORD || "quantic_dev_password",
  max: 10,
});

app.use(helmet());
app.use(express.json({ limit: "10kb" }));

app.get("/api/health", async (_request, response, next) => {
  try {
    await pool.query("SELECT 1");
    response.json({ status: "ok" });
  } catch (error) {
    next(error);
  }
});

app.post("/api/reservations", async (request, response, next) => {
  const body = request.body && typeof request.body === "object" ? request.body : {};
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const reservationAt = typeof body.reservationAt === "string" ? body.reservationAt : "";
  const partySize = Number(body.partySize);
  const newsletterSignup = body.newsletterSignup === true;

  if (!name || name.length > 120) {
    return response.status(400).json({ error: "Please enter a name (up to 120 characters)." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return response.status(400).json({ error: "Please enter a valid email address." });
  }
  if (phone.length > 40) {
    return response.status(400).json({ error: "Phone number must be 40 characters or fewer." });
  }
  if (!Number.isInteger(partySize) || partySize < 1 || partySize > 12) {
    return response.status(400).json({ error: "Choose a party size from 1 to 12." });
  }

  const parsedReservationAt = new Date(reservationAt);
  if (!reservationAt || Number.isNaN(parsedReservationAt.getTime()) || parsedReservationAt <= new Date()) {
    return response.status(400).json({ error: "Choose a reservation time in the future." });
  }
  if (parsedReservationAt.getUTCSeconds() !== 0 || parsedReservationAt.getUTCMilliseconds() !== 0 || parsedReservationAt.getUTCMinutes() % 30 !== 0) {
    return response.status(400).json({ error: "Choose a reservation time on a 30-minute interval." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const slotKey = parsedReservationAt.toISOString();
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [slotKey]);
    const existingReservation = await client.query(
      `SELECT reservation_id
       FROM reservations
       WHERE reservation_at = $1
       LIMIT 1`,
      [slotKey],
    );
    if (existingReservation.rowCount > 0) {
      await client.query("ROLLBACK");
      return response.status(409).json({
        error: "That time slot is already reserved. Please choose another time.",
      });
    }

    const availability = await client.query(
      `SELECT COALESCE(SUM(party_size), 0)::integer AS booked_guests
       FROM reservations
       WHERE reservation_at = $1`,
      [slotKey],
    );
    const bookedGuests = availability.rows[0].booked_guests;
    if (bookedGuests + partySize > maxGuestsPerSlot) {
      await client.query("ROLLBACK");
      return response.status(409).json({
        error: "Sorry, that time slot is fully booked for your party. Please choose another time.",
      });
    }

    const customer = await client.query(
      `INSERT INTO customers (customer_name, customer_email, phone_number, newsletter_signup)
       VALUES ($1, $2, NULLIF($3, ''), $4)
       ON CONFLICT (customer_email) DO UPDATE SET
         customer_name = EXCLUDED.customer_name,
         phone_number = COALESCE(EXCLUDED.phone_number, customers.phone_number),
         newsletter_signup = customers.newsletter_signup OR EXCLUDED.newsletter_signup
       RETURNING customer_id`,
      [name, email, phone, newsletterSignup],
    );
    const reservation = await client.query(
      `INSERT INTO reservations (customer_id, reservation_at, party_size)
       VALUES ($1, $2, $3)
       RETURNING reservation_id, reservation_at, party_size`,
      [customer.rows[0].customer_id, slotKey, partySize],
    );
    await client.query("COMMIT");
    response.status(201).json({
      reservationId: reservation.rows[0].reservation_id,
      customerId: customer.rows[0].customer_id,
      reservationAt: reservation.rows[0].reservation_at,
      partySize: reservation.rows[0].party_size,
      message: "Your reservation request is confirmed. We look forward to welcoming you.",
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    next(error);
  } finally {
    client.release();
  }
});

app.use("/images", express.static(path.join(__dirname, "../Images"), { maxAge: "1d" }));
app.use(express.static(path.join(__dirname, "public"), { maxAge: process.env.NODE_ENV === "production" ? "1h" : 0 }));

app.use((error, _request, response, _next) => {
  console.error(error);
  if (response.headersSent) return;
  response.status(500).json({ error: "Something went wrong. Please try again shortly." });
});

async function start() {
  const schema = fs.readFileSync(path.join(__dirname, "../init/001_schema.sql"), "utf8");
  await pool.query(schema);
  app.listen(port, "0.0.0.0", () => {
    console.log(`Reservation website listening on port ${port}`);
  });
}

start().catch((error) => {
  console.error("Unable to start the reservation website:", error);
  process.exit(1);
});

process.on("SIGTERM", async () => {
  await pool.end();
  process.exit(0);
});
