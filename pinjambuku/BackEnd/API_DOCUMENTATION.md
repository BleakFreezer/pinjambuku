# PinjamBuku. Backend API Documentation

## 📋 Daftar Isi

- [Pendahuluan](#pendahuluan)
- [Instalasi & Setup](#instalasi--setup)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)

---

## Pendahuluan

Backend PinjamBuku. adalah REST API yang dibangun untuk mengelola sistem perpustakaan digital sekolah. API ini menyediakan fungsi untuk:

- 📚 Manajemen Buku (CRUD)
- 👥 Manajemen Pengguna & Autentikasi
- 🔄 Peminjaman & Pengembalian Buku
- 📊 Laporan & Statistik
- 🏷️ Kategori & Tag Buku

---

## Instalasi & Setup

### Prerequisites

- Node.js v14+
- MongoDB atau Database lainnya
- npm atau yarn

### Step 1: Inisialisasi Project

```bash
cd BackEnd
npm init -y
```

### Step 2: Install Dependencies

```bash
npm install express mongoose cors dotenv bcryptjs jsonwebtoken
npm install --save-dev nodemon
```

### Step 3: Buat File .env

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/pinjambuku
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

### Step 4: Jalankan Server

```bash
npm start
# atau dengan nodemon untuk development
npm run dev
```

---

## Authentication

### Login

**Endpoint:** `POST /api/auth/login`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (Success):**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "user"
  }
}
```

### Register

**Endpoint:** `POST /api/auth/register`

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Registration successful",
  "user": {
    "id": "123",
    "name": "John Doe",
    "email": "user@example.com"
  }
}
```

---

## API Endpoints

### 📚 Books Management

#### Get All Books

**Endpoint:** `GET /api/books`

**Query Parameters:**

- `page` (optional): Page number for pagination
- `limit` (optional): Items per page (default: 10)
- `category` (optional): Filter by category
- `search` (optional): Search by title or author

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "title": "Laskar Pelangi",
      "author": "Andrea Hirata",
      "publisher": "Bentang Pustaka",
      "category": "Fiction",
      "year": 2005,
      "stock": 15,
      "available": 12,
      "isbn": "978-979-792-549-6",
      "coverImage": "url-to-image",
      "rating": 4.8,
      "description": "Book description..."
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10
  }
}
```

#### Get Book by ID

**Endpoint:** `GET /api/books/:id`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "Laskar Pelangi",
    "author": "Andrea Hirata",
    "publisher": "Bentang Pustaka",
    "category": "Fiction",
    "year": 2005,
    "stock": 15,
    "available": 12,
    "isbn": "978-979-792-549-6",
    "coverImage": "url-to-image",
    "rating": 4.8,
    "description": "Book description...",
    "reviews": [
      {
        "userId": "user123",
        "userName": "Budi",
        "rating": 5,
        "comment": "Buku yang luar biasa!",
        "date": "2025-01-15"
      }
    ]
  }
}
```

#### Add Book (Admin Only)

**Endpoint:** `POST /api/books`

**Headers:**

```
Authorization: Bearer {token}
```

**Request Body:**

```json
{
  "title": "Laskar Pelangi",
  "author": "Andrea Hirata",
  "publisher": "Bentang Pustaka",
  "category": "Fiction",
  "year": 2005,
  "stock": 15,
  "isbn": "978-979-792-549-6",
  "description": "Book description...",
  "coverImage": "url-to-image"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Book added successfully",
  "data": {
    "id": "1",
    "title": "Laskar Pelangi"
    // ... other fields
  }
}
```

#### Update Book (Admin Only)

**Endpoint:** `PUT /api/books/:id`

**Headers:**

```
Authorization: Bearer {token}
```

**Request Body:**

```json
{
  "title": "Laskar Pelangi (Updated)",
  "stock": 20
}
```

**Response:**

```json
{
  "success": true,
  "message": "Book updated successfully",
  "data": {
    /* updated book */
  }
}
```

#### Delete Book (Admin Only)

**Endpoint:** `DELETE /api/books/:id`

**Headers:**

```
Authorization: Bearer {token}
```

**Response:**

```json
{
  "success": true,
  "message": "Book deleted successfully"
}
```

---

### 👥 Users Management

#### Get All Users (Admin Only)

**Endpoint:** `GET /api/users`

**Headers:**

```
Authorization: Bearer {token}
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "user123",
      "name": "Budi Santoso",
      "email": "budi@email.com",
      "role": "user",
      "createdAt": "2025-01-01",
      "borrowedBooksCount": 3,
      "totalLateFines": 0
    }
  ]
}
```

#### Get User Profile

**Endpoint:** `GET /api/users/profile`

**Headers:**

```
Authorization: Bearer {token}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user123",
    "name": "Budi Santoso",
    "email": "budi@email.com",
    "phone": "081234567890",
    "role": "user",
    "createdAt": "2025-01-01",
    "lastLogin": "2025-01-15"
  }
}
```

#### Update User Profile

**Endpoint:** `PUT /api/users/profile`

**Headers:**

```
Authorization: Bearer {token}
```

**Request Body:**

```json
{
  "name": "Budi Santoso Updated",
  "phone": "081234567890"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    /* updated user */
  }
}
```

---

### 🔄 Borrowing Management

#### Get All Borrowings

**Endpoint:** `GET /api/borrowings`

**Query Parameters:**

- `status` (optional): active, returned, overdue
- `userId` (optional): Filter by user

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "borrow123",
      "userId": "user123",
      "userName": "Budi Santoso",
      "bookId": "book1",
      "bookTitle": "Laskar Pelangi",
      "borrowDate": "2025-01-10",
      "dueDate": "2025-01-24",
      "returnDate": null,
      "status": "active",
      "fineAmount": 0
    }
  ]
}
```

#### Borrow Book

**Endpoint:** `POST /api/borrowings`

**Headers:**

```
Authorization: Bearer {token}
```

**Request Body:**

```json
{
  "bookId": "book1",
  "durationDays": 14
}
```

**Response:**

```json
{
  "success": true,
  "message": "Book borrowed successfully",
  "data": {
    "id": "borrow123",
    "bookTitle": "Laskar Pelangi",
    "borrowDate": "2025-01-15",
    "dueDate": "2025-01-29",
    "status": "active"
  }
}
```

#### Return Book

**Endpoint:** `PUT /api/borrowings/:id/return`

**Headers:**

```
Authorization: Bearer {token}
```

**Request Body:**

```json
{
  "returnCondition": "good" // good, fair, damaged
}
```

**Response:**

```json
{
  "success": true,
  "message": "Book returned successfully",
  "data": {
    "id": "borrow123",
    "returnDate": "2025-01-25",
    "status": "returned",
    "fineAmount": 0
  }
}
```

---

### 📊 Reports

#### Get Borrowing Reports

**Endpoint:** `GET /api/reports/borrowings`

**Query Parameters:**

- `startDate`: YYYY-MM-DD
- `endDate`: YYYY-MM-DD
- `groupBy`: monthly, weekly, daily (optional)

**Response:**

```json
{
  "success": true,
  "data": {
    "totalBorrowings": 150,
    "activeBorrowings": 89,
    "overdueItems": 12,
    "returnedItems": 49,
    "timeline": [
      {
        "date": "2025-01-15",
        "borrowCount": 5,
        "returnCount": 3
      }
    ]
  }
}
```

#### Get User Statistics

**Endpoint:** `GET /api/reports/users`

**Response:**

```json
{
  "success": true,
  "data": {
    "totalUsers": 567,
    "activeUsers": 450,
    "usersWithOverdueBooks": 12,
    "topBorrowers": [
      {
        "userId": "user1",
        "name": "Budi",
        "borrowCount": 25
      }
    ]
  }
}
```

---

## Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  phone: String,
  role: String, // 'user', 'admin'
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date
}
```

### Books Collection

```javascript
{
  _id: ObjectId,
  title: String,
  author: String,
  publisher: String,
  category: String,
  year: Number,
  isbn: String,
  description: String,
  coverImage: String,
  stock: Number,
  available: Number,
  rating: Number,
  reviews: [
    {
      userId: ObjectId,
      userName: String,
      rating: Number,
      comment: String,
      date: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### Borrowings Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  bookId: ObjectId,
  borrowDate: Date,
  dueDate: Date,
  returnDate: Date,
  status: String, // 'active', 'returned', 'overdue'
  fineAmount: Number,
  returnCondition: String,
  notes: String,
  createdAt: Date
}
```

---

## Error Handling

Semua error responses mengikuti format berikut:

```json
{
  "success": false,
  "error": {
    "code": "BOOK_NOT_FOUND",
    "message": "Book with ID '123' not found",
    "statusCode": 404
  }
}
```

### Common Error Codes

- `UNAUTHORIZED` (401): Token invalid atau expired
- `FORBIDDEN` (403): User tidak memiliki akses
- `NOT_FOUND` (404): Resource tidak ditemukan
- `VALIDATION_ERROR` (400): Input validation failed
- `INTERNAL_ERROR` (500): Server error

---

## Next Steps

1. **Implement Backend Server** dengan Express.js dan MongoDB
2. **Add Authentication** dengan JWT
3. **Add Validation** untuk semua endpoints
4. **Add Rate Limiting** untuk API security
5. **Add Caching** untuk performance
6. **Add Testing** dengan Jest/Mocha
7. **Deploy** ke server production

---

**Last Updated:** 2025-01-15
**Version:** 1.0.0
