import express from 'express';
import { query } from '../db';
import auth from '../utils/auth';

const router = express.Router();

// GET /api/availability?room_id=&checkin=&checkout=
router.get('/', async (req, res) => {
  try {
    const roomId = parseInt(String(req.query.room_id));
    const checkin = String(req.query.checkin);
    const checkout = String(req.query.checkout);

    if (!roomId || !checkin || !checkout) {
      return res.status(400).json({ error: 'room_id, checkin and checkout are required' });
    }

    const sql = `
      SELECT 1 FROM bookings
      WHERE room_id = $1
        AND status IN ('pending','paid','confirmed')
        AND NOT (checkout_date <= $2 OR checkin_date >= $3)
      LIMIT 1
    `;

    const r = await query(sql, [roomId, checkin, checkout]);
    const isAvailable = r.rowCount === 0;
    res.json({ available: isAvailable });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// POST /api/bookings
// body: { room_id, user_id (optional), checkin_date, checkout_date }
router.post('/', auth.optional, async (req, res) => {
  try {
    const { room_id, checkin_date, checkout_date, user_id } = req.body;
    if (!room_id || !checkin_date || !checkout_date) {
      return res.status(400).json({ error: 'room_id, checkin_date, checkout_date required' });
    }

    // check availability
    const conflictQ = await query(
      `SELECT 1 FROM bookings WHERE room_id = $1 AND status IN ('pending','paid','confirmed') AND NOT (checkout_date <= $2 OR checkin_date >= $3) LIMIT 1`,
      [room_id, checkin_date, checkout_date]
    );
    if (conflictQ.rowCount > 0) return res.status(409).json({ error: 'room not available for selected dates' });

    // get room price
    const roomQ = await query('SELECT price_per_night FROM rooms WHERE id = $1', [room_id]);
    if (roomQ.rowCount === 0) return res.status(404).json({ error: 'room not found' });
    const pricePerNight = Number(roomQ.rows[0].price_per_night);

    // compute nights
    const d1 = new Date(checkin_date);
    const d2 = new Date(checkout_date);
    const msPerDay = 1000 * 60 * 60 * 24;
    const nights = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / msPerDay));
    const totalAmount = Number((pricePerNight * nights).toFixed(2));

    const insertQ = await query(
      `INSERT INTO bookings (user_id, room_id, checkin_date, checkout_date, total_amount, status, created_at)
       VALUES ($1,$2,$3,$4,$5,'pending',now()) RETURNING id`,
      [user_id || null, room_id, checkin_date, checkout_date, totalAmount]
    );

    const bookingId = insertQ.rows[0].id;
    res.status(201).json({ booking_id: bookingId, total_amount: totalAmount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

export default router;
