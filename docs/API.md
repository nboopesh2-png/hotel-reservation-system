# Hotel Reservation System - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints that require authentication need a JWT token in the Authorization header:
```
Authorization: Bearer {token}
```

## Endpoints

### Authentication

#### Register User
**POST** `/auth/register`
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "1234567890"
}
```

Response (201):
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Login User
**POST** `/auth/login`
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Response (200):
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Hotels

#### Get All Hotels
**GET** `/hotels`

Response (200):
```json
[
  {
    "id": 1,
    "name": "Grand Hotel Plaza",
    "address": "123 Main Street, Downtown",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "rating": 4.8,
    "price_per_night": 250,
    "description": "Luxury 5-star hotel in downtown..."
  }
]
```

#### Get Nearby Hotels
**GET** `/hotels/nearby?latitude=40.7128&longitude=-74.0060&radius=10`

Parameters:
- `latitude` (required): User's latitude
- `longitude` (required): User's longitude
- `radius` (optional): Search radius in km (default: 10)

Response (200):
```json
[
  {
    "id": 1,
    "name": "Grand Hotel Plaza",
    "distance": 0.5,
    ...
  }
]
```

#### Get Hotel Details
**GET** `/hotels/:id`

Response (200): Hotel object

### Bookings

#### Create Booking
**POST** `/bookings` (Requires Authentication)
```json
{
  "hotelId": 1,
  "checkInDate": "2024-07-25",
  "checkOutDate": "2024-07-27",
  "roomType": "Deluxe Suite",
  "totalPrice": 500
}
```

Response (201):
```json
{
  "message": "Booking created successfully",
  "booking": {
    "id": 1,
    "booking_code": "BK1690000000000",
    "total_price": 500,
    "qrCode": "data:image/png;base64,..."
  }
}
```

#### Get User Bookings
**GET** `/bookings/user/my-bookings` (Requires Authentication)

Response (200): Array of booking objects

#### Verify Booking with QR Code
**POST** `/bookings/verify`
```json
{
  "bookingCode": "BK1690000000000"
}
```

Response (200):
```json
{
  "message": "Booking verified",
  "booking": {
    "id": 1,
    "hotel_name": "Grand Hotel Plaza",
    "check_in_date": "2024-07-25",
    ...
  }
}
```

### Reviews

#### Get Hotel Reviews
**GET** `/reviews/hotel/:hotelId`

Response (200): Array of review objects

#### Create Review
**POST** `/reviews` (Requires Authentication)
```json
{
  "hotelId": 1,
  "rating": 5,
  "comment": "Excellent hotel! Great service and clean rooms."
}
```

Response (201):
```json
{
  "message": "Review created successfully",
  "review": {
    "id": 1,
    "rating": 5,
    "comment": "Excellent hotel!..."
  }
}
```

### Users

#### Get User Profile
**GET** `/users/profile` (Requires Authentication)

Response (200):
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "created_at": "2024-07-24T10:00:00Z"
}
```

#### Update User Profile
**PUT** `/users/profile` (Requires Authentication)
```json
{
  "name": "John Doe",
  "phone": "0987654321"
}
```

Response (200):
```json
{
  "message": "Profile updated successfully",
  "user": { ... }
}
```

## Error Responses

```json
{
  "error": "Error message here"
}
```

## Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error
