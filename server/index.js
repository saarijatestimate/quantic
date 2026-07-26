import express from 'express';
import cors from 'cors';
import pool from './db.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));

// Create or find customer by email
async function findOrCreateCustomer(client, { customer_name, email, phone }) {
  const qFind = 'SELECT id FROM "Customer" WHERE email = $1';
  const r = await client.query(qFind, [email]);
  if (r.rows.length) return r.rows[0].id;

  const qIns = 'INSERT INTO "Customer" (customer_name, email, phone) VALUES ($1, $2, $3) RETURNING id';
  const ins = await client.query(qIns, [customer_name, email, phone]);
  return ins.rows[0].id;
}

// POST /reservations
app.post('/reservations', async (req, res) => {
  const { customer_name, email, phone, reservation_time, number_of_guests, notes } = req.body;
  if (!customer_name || !email || !reservation_time || !number_of_guests) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const customerId = await findOrCreateCustomer(client, { customer_name, email, phone });
    const qRes = `INSERT INTO "Reservations" (customer_id, reservation_time, number_of_guests, notes) VALUES ($1, $2, $3, $4) RETURNING id, reservation_time, number_of_guests, notes, created_at`;
    const r = await client.query(qRes, [customerId, reservation_time, number_of_guests, notes || null]);
    await client.query('COMMIT');
    return res.status(201).json({ reservation: r.rows[0], customer_id: customerId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /reservations
app.get('/reservations', async (req, res) => {
  try {
    const q = `SELECT r.id, r.reservation_time, r.number_of_guests, r.notes, r.created_at, c.id as customer_id, c.customer_name, c.email, c.phone FROM "Reservations" r JOIN "Customer" c ON r.customer_id = c.id ORDER BY r.reservation_time DESC`;
    const { rows } = await pool.query(q);
    return res.json({ reservations: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
