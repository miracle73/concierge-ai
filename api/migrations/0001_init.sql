CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY,
  booking_ref TEXT NOT NULL UNIQUE,
  guest_name TEXT NOT NULL,
  room_number TEXT NOT NULL,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
