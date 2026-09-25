CREATE TABLE IF NOT EXISTS customers (
    customer_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL UNIQUE,
    phone_number TEXT,
    newsletter_signup BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservations (
    reservation_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers (customer_id) ON DELETE RESTRICT,
    reservation_at TIMESTAMPTZ NOT NULL,
    party_size INTEGER NOT NULL CHECK (party_size > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reservations_customer_id_idx
    ON reservations (customer_id);

CREATE INDEX IF NOT EXISTS reservations_reservation_at_idx
    ON reservations (reservation_at);
