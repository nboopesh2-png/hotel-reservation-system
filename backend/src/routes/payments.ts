import express from 'express';
import { query } from '../db';
import https from 'https';
import crypto from 'crypto';

const router = express.Router();

// Helper to create Razorpay order via REST API (no external SDK required)
function createRazorpayOrder(amountINR: number, receipt: string, keyId: string, keySecret: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      amount: Math.round(amountINR * 100),
      currency: 'INR',
      receipt,
      payment_capture: 1
    });

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const options = {
      hostname: 'api.razorpay.com',
      port: 443,
      path: '/v1/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Basic ${auth}`
      }
    } as https.RequestOptions;

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (e) { reject(e); }
        } else {
          reject(new Error(`Razorpay API error: ${res.statusCode} ${data}`));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

// POST /api/payments/razorpay/create-order
// body: { booking_id }
router.post('/razorpay/create-order', async (req, res) => {
  try {
    const { booking_id } = req.body;
    if (!booking_id) return res.status(400).json({ error: 'booking_id required' });

    const bookingQ = await query('SELECT id, total_amount FROM bookings WHERE id = $1', [booking_id]);
    if (bookingQ.rowCount === 0) return res.status(404).json({ error: 'booking not found' });
    const booking = bookingQ.rows[0];

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return res.status(500).json({ error: 'razorpay keys not configured' });

    const receipt = `booking_${booking_id}`;
    const order = await createRazorpayOrder(Number(booking.total_amount), receipt, keyId, keySecret);

    // save order id on booking so webhook can reconcile
    await query('UPDATE bookings SET payment_order_id = $1 WHERE id = $2', [order.id, booking_id]);

    res.json({ order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Razorpay webhook - verify signature and handle events
// Use express.raw to access raw body for signature verification when mounting in app
router.post('/razorpay/webhook', express.raw({ type: '*/*' }), async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) return res.status(500).send('webhook secret not configured');

    const signature = String(req.headers['x-razorpay-signature'] || '');
    const body = req.body as Buffer;

    const expected = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');
    if (signature !== expected) {
      console.warn('Invalid webhook signature');
      return res.status(400).send('invalid signature');
    }

    const payload = JSON.parse(body.toString());
    const event = payload.event;

    if (event === 'payment.captured' || event === 'payment.authorized') {
      const payment = payload.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;

      // find booking by payment_order_id
      const b = await query('SELECT id FROM bookings WHERE payment_order_id = $1 LIMIT 1', [orderId]);
      if (b.rowCount === 0) {
        console.warn('Booking not found for order:', orderId);
        return res.status(200).send('ok');
      }
      const bookingId = b.rows[0].id;

      await query('UPDATE bookings SET status = $1, payment_id = $2 WHERE id = $3', ['paid', paymentId, bookingId]);
      // TODO: enqueue confirmation email / notification
    }

    res.status(200).send('ok');
  } catch (err) {
    console.error('webhook error', err);
    res.status(500).send('error');
  }
});

export default router;
