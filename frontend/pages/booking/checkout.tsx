import { useState } from 'react';

export default function CheckoutPage() {
  const [roomId, setRoomId] = useState('');
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  async function checkAvailability() {
    if (!roomId || !checkin || !checkout) return alert('fill fields');
    const url = `/api/proxy/availability?room_id=${roomId}&checkin=${checkin}&checkout=${checkout}`;
    const r = await fetch(url);
    const d = await r.json();
    if (!d.available) {
      setMessage('Room not available for selected dates');
    } else {
      setMessage('Room available — proceed to create booking');
    }
  }

  async function createBooking() {
    const r = await fetch('/api/proxy/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_id: Number(roomId), checkin_date: checkin, checkout_date: checkout })
    });
    const d = await r.json();
    if (r.status === 201) {
      setBookingId(d.booking_id);
      setTotal(d.total_amount);
      setMessage('Booking created. Click Pay to open Razorpay checkout.');
    } else {
      setMessage(d.error || 'error creating booking');
    }
  }

  async function payNow() {
    if (!bookingId) return alert('create booking first');
    // request backend to create razorpay order
    const r = await fetch('/api/proxy/payments/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: bookingId })
    });
    const d = await r.json();
    if (!r.ok) return setMessage(d.error || 'failed to create order');

    const order = d.order;
    const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || (window as any).RAZORPAY_KEY_ID;

    // load Razorpay checkout script if not loaded
    if (!(window as any).Razorpay) {
      await new Promise((res) => {
        const s = document.createElement('script');
        s.src = 'https://checkout.razorpay.com/v1/checkout.js';
        s.onload = res;
        document.body.appendChild(s);
      });
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || (window as any).RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'Hotel Reservation',
      description: `Booking #${bookingId}`,
      order_id: order.id,
      handler: function (response: any) {
        // The server will receive webhook from Razorpay — frontend can poll booking status or rely on server to notify
        setMessage('Payment processed. You will get confirmation shortly.');
      },
      prefill: {
        name: '',
        email: ''
      },
      theme: {
        color: '#3399cc'
      }
    };

    const rz = new (window as any).Razorpay(options);
    rz.open();
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Booking Checkout (Demo)</h1>
      <div>
        <label>Room ID: <input value={roomId} onChange={(e) => setRoomId(e.target.value)} /></label>
      </div>
      <div>
        <label>Check-in: <input type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} /></label>
      </div>
      <div>
        <label>Check-out: <input type="date" value={checkout} onChange={(e) => setCheckout(e.target.value)} /></label>
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={checkAvailability}>Check availability</button>
        <button onClick={createBooking} style={{ marginLeft: 8 }}>Create booking</button>
        <button onClick={payNow} style={{ marginLeft: 8 }}>Pay now</button>
      </div>

      <div style={{ marginTop: 16 }}>
        <p>{message}</p>
        {bookingId && <p>Booking ID: {bookingId} — Amount: ₹{total}</p>}
      </div>

    </div>
  );
}
