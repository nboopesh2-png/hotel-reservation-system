# Booking & Payment README additions

This branch adds a booking and Razorpay payment scaffold.

New backend routes (mount under /api):
- GET /api/availability?room_id=&checkin=&checkout=
- POST /api/bookings  { room_id, checkin_date, checkout_date }
- POST /api/payments/razorpay/create-order  { booking_id }
- POST /api/payments/razorpay/webhook  (raw body, secured by RAZORPAY_WEBHOOK_SECRET)

Frontend demo page:
- /booking/checkout  - demo flow to create booking and open Razorpay Checkout

Testing notes:
- Use Razorpay test keys and set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET in backend .env
- For webhook testing locally use ngrok and configure webhook URL in Razorpay dashboard.
